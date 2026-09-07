# M3 文档上传与异步任务

M3 打通最小文档入库入口：管理员上传一份 PDF、Markdown 或 TXT 文件，API 将文件保存到本地并创建 BullMQ 任务，Worker 验证文件后更新任务进度和结果。

## 功能范围

- 单次上传一个 PDF、Markdown 或 TXT 文件，最大 10 MB。
- 原始文件写入 `UPLOAD_DIR`，默认目录为 `data/uploads`。
- `documents` 保存文档元数据和总体状态。
- `ingestion_jobs` 保存每次队列处理的状态、进度、尝试次数和错误。
- Worker 使用文档 ID Redis 锁，避免同一文档被并发处理。
- 失败文档可以原地重试，不创建重复文档记录。
- 删除文档时级联删除任务记录，并删除本地原始文件。

M3 不读取正文，也不生成 Chunk 或向量。Worker 的完成状态只表示文件已被安全保存并通过入库预检；解析、切片和 Embedding 从 M4 开始。

## 状态流转

```text
PENDING → PROCESSING → COMPLETED
              │
              └→ 自动重试 → FAILED → 手动重试
```

每个 BullMQ 任务最多尝试 3 次。处理中禁止删除文档，避免数据库记录和磁盘文件与正在运行的任务相互冲突。

## API

所有接口都需要 Bearer Token。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/documents` | 查看文档、最新任务和进度 |
| `POST` | `/documents` | 使用 `multipart/form-data` 上传文件 |
| `POST` | `/documents/:id/retry` | 重试失败文档 |
| `DELETE` | `/documents/:id` | 删除文档与原始文件 |

上传请求包含 `knowledgeBaseId` 和 `file` 两个字段。API 返回文件名、格式、大小和状态，但不会返回服务器本地存储路径。

## 本地验证

先启动 PostgreSQL、Redis 和三个应用：

```bash
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

登录后台后进入“文档处理”，选择知识库并上传 [`samples/m3-demo.txt`](samples/m3-demo.txt)。列表应短暂显示待处理或处理中，随后显示完成且进度为 100%。

可以额外验证：

- `.docx` 等不支持格式会被拒绝。
- 超过 10 MB 的文件会被拒绝。
- 已完成文档不能调用失败重试接口。
- 删除完成后，文档记录、任务记录和本地文件均不存在。

## M3 明确不做

- 批量上传、目录上传、URL 抓取和对象存储。
- PDF 正文提取、OCR、复杂版面与表格识别。
- 文本切片、Embedding、向量入库与索引重建。
- 任务暂停、优先级和定时执行。
