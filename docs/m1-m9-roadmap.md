# M1–M9 最小 Demo 开发路线

## 1. 目标与范围原则

本路线只交付一条可以现场演示的完整闭环：

```text
管理员登录
  → 创建知识库
  → 上传一份 PDF / Markdown / TXT 文档
  → Worker 异步解析、切片并生成向量
  → 使用混合检索查看召回结果
  → 基于召回内容流式回答并展示引用
  → CI 构建镜像并部署
  → 查看日志并按 Git SHA 回滚
```

所有里程碑遵守以下原则：

- 只支持单租户、单管理员，不做注册、邀请、组织和 RBAC。
- 每类能力只实现一条主流程和必要的失败提示。
- 不做通用平台、插件系统、工作流编排和高度可配置化。
- 优先使用成熟库和框架默认能力，不自研基础设施。
- UI 以可操作、可演示为标准，不追求完整设计系统。
- 每个里程碑必须可独立验收，未满足验收条件不进入下一阶段。
- 新需求默认进入 Demo 之后的 backlog，不插入 M1–M9。

## 2. 固定技术决策

为避免开发过程中反复选型，Demo 固定采用：

| 领域 | 最小实现 |
| --- | --- |
| Monorepo | pnpm workspace |
| 前端 | React、TypeScript、Vite、Ant Design、TanStack Query |
| API | NestJS、Prisma、Swagger |
| Worker | 独立 NestJS 应用、BullMQ |
| 数据库 | PostgreSQL、pgvector、PostgreSQL 全文检索 |
| 缓存/队列 | Redis |
| AI 接口 | OpenRouter 的 OpenAI-compatible API |
| 文档存储 | 本地目录/ Docker Volume，不接对象存储 |
| PDF 解析 | 仅提取可复制文本，不做 OCR |
| 检索融合 | 向量 TopK + 全文 TopK + RRF |
| 部署 | Docker Compose、GHCR、单台腾讯云 Ubuntu 主机 |
| 入口 | Nginx 单入口 |
| CI/CD | GitHub Actions |

Demo 不引入 Elasticsearch、Kubernetes、消息总线、对象存储、可观测性平台、模型路由平台或多云部署。

## 3. 里程碑总览

| 里程碑 | 核心结果 | 前置依赖 |
| --- | --- | --- |
| M1 | Monorepo 与本地依赖可运行 | 无 |
| M2 | 管理员能登录并管理知识库 | M1 |
| M3 | 文档能上传并进入异步队列 | M2 |
| M4 | 文档能完成切片和向量入库 | M3 |
| M5 | 能完成混合检索和带引用问答 | M4 |
| M6 | 核心闭环有自动化测试保护 | M5 |
| M7 | 全部服务可通过 Docker Compose 运行 | M6 |
| M8 | main 分支可自动构建并部署到目标主机 | M7 |
| M9 | 能定位故障并回滚到指定版本 | M8 |

---

## M1：项目骨架与本地开发环境

### 必做

- 建立 pnpm workspace：`apps/web`、`apps/api`、`apps/worker`、`packages/shared`。
- Web 提供一个应用壳、登录页占位和仪表盘占位。
- API 提供 `GET /health` 和 Swagger。
- Worker 可以启动并连接 Redis，注册一个测试队列消费者。
- Prisma 连接 PostgreSQL，并启用 pgvector 扩展。
- `compose.yml` 只启动本地 PostgreSQL 和 Redis。
- 提供 `.env.example`、统一的 lint、typecheck、test、build、dev 脚本。

### 明确不做

- 不实现业务表和正式页面。
- 不编写生产 Dockerfile。
- 不搭建 CI/CD。

### 验收

- 新环境执行文档中的命令后，PostgreSQL 和 Redis 正常运行。
- `pnpm dev` 能同时启动 Web、API 和 Worker。
- Web 页面可访问，Swagger 可访问，`/health` 返回 API、PostgreSQL、Redis 状态。
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` 全部通过。

## M2：登录与知识库 CRUD

### 必做

- 建立 `users`、`knowledge_bases`、`operation_logs` 表和 Prisma migration。
- Seed 一个由环境变量指定密码的管理员账户。
- 实现管理员登录、退出、获取当前用户。
- 使用短期 JWT 访问令牌；Redis 保存服务端会话，退出时删除会话。
- API Auth Guard 与前端受保护路由。
- 知识库列表、创建、编辑、删除页面。
- 知识库只保留必要字段：名称、描述、状态、chunk size、chunk overlap、topK、相似度阈值、Chat 模型、Embedding 模型。
- 对登录以及知识库写操作记录最小审计日志。

### 明确不做

- 不做注册、找回密码、多管理员、RBAC、第三方登录和双因素认证。
- 不做 refresh token 自动续期；登录过期后重新登录。
- 不做知识库复制、导入导出和复杂筛选。

### 验收

- 未登录用户无法访问后台页面和受保护 API。
- 默认管理员可以登录和退出。
- 可以完成知识库创建、查看、修改、删除。
- 删除非空知识库的规则提前固定：Demo 采用级联删除，并在 UI 二次确认。

## M3：文档上传与异步任务

### 必做

- 建立 `documents`、`ingestion_jobs` 表。
- 支持 PDF、Markdown、TXT 单文件上传。
- 文件保存到本地上传目录，数据库保存原始文件名、存储路径、MIME、大小和状态。
- API 创建 BullMQ 入库任务，Worker 消费任务并更新进度。
- 文档列表展示格式、大小、状态、进度和失败原因。
- 支持删除文档和对失败任务执行一次手动重试。
- 实现基于文档 ID 的幂等保护，避免同一任务并发处理。

### 明确不做

- 不做批量上传、拖拽目录、URL 抓取、云盘同步和文件版本管理。
- 不做 OCR、扫描 PDF、表格/图片理解和复杂版面恢复。
- 不做任务暂停、优先级和定时处理。

### 验收

- 三种支持格式均可上传并产生任务。
- 不支持的扩展名和超出限制的文件被拒绝。
- Worker 能把任务状态从待处理推进到处理中并结束。
- 任务失败时能看到可理解的原因，点击重试不会产生重复文档记录。
- 删除文档时同时删除原始文件和关联任务记录。

## M4：解析、切片与向量入库

### 必做

- 建立 `document_chunks` 表及 pgvector 向量列。
- 实现 PDF 文本提取、Markdown/TXT 文本读取。
- 实现一种确定性的字符切片算法，支持 chunk size 和 overlap。
- 批量请求 OpenRouter Embedding API。
- 在单次处理流程中写入 Chunk、元数据和向量，并更新任务状态。
- 提供 Chunk 列表与详情查看。
- 支持重新构建索引：先生成新结果，成功后替换旧 Chunk。
- 校验知识库 Embedding 模型与向量维度的一致性。

### 明确不做

- 不做语义切片、标题层级切片、表格专项切片和多模态向量。
- 不做多个 Embedding 模型共存于同一知识库。
- 不做自动调参和向量压缩。

### 验收

- 一份有效文档可经历解析、切片、向量化并进入“已完成”。
- Chunk 可在后台查看，且包含文档来源和序号。
- 同一任务重复执行不会重复写入 Chunk。
- Embedding 调用失败时任务进入失败状态，已有有效索引不被破坏。

## M5：混合检索与 AI 问答

### 必做

- 实现 Query Embedding 和 pgvector 语义检索。
- 实现 PostgreSQL 全文检索。
- 使用固定公式执行 RRF 融合、阈值过滤和 TopK 截断。
- 检索测试台展示两路召回、原始分数、融合排名、来源和最终上下文。
- 建立 `conversations`、`messages`、`retrieval_records` 表。
- 实现单轮问题的流式回答；每次提问保存用户消息、AI 消息和检索记录。
- 回答展示引用文档及 Chunk；无结果或低于阈值时返回固定拒答文案。
- 记录检索耗时和生成耗时。
- 完成最小仪表盘：数量统计、最近任务、最近问答和依赖健康状态。

### 明确不做

- 不做 reranker、Query Rewrite、HyDE、Agent、工具调用和联网搜索。
- 不做多轮上下文压缩；会话页可以保留历史，但每次生成仅使用当前问题和检索上下文。
- 不做引用精确到 PDF 页面的保证，引用只定位到文档和 Chunk。
- 不做 Prompt 模板管理和模型效果评测平台。

### 验收

- 测试台能清楚展示向量、全文和 RRF 三阶段结果。
- 对知识库内有答案的问题，能流式输出并显示至少一个可追溯引用。
- 对无足够相似结果的问题能够拒答。
- 刷新页面后仍能查看已保存的问答和检索记录。

## M6：自动化测试

### 必做

- Web：登录表单、受保护路由、知识库表单的少量单元测试。
- API：认证、知识库 CRUD、上传校验的单元/集成测试。
- Worker：切片、幂等、失败状态的单元测试。
- 检索：RRF 排名、阈值过滤、来源映射的确定性测试。
- E2E：覆盖一次“登录 → 创建知识库 → 上传 TXT → Worker 处理 → 检索”的主流程。
- AI API 在自动化测试中使用 mock，不依赖真实额度和网络稳定性。

### 明确不做

- 不追求覆盖率数字，不做视觉回归、压力测试、混沌测试和全浏览器矩阵。
- 不测试框架和第三方库自身行为。

### 验收

- 所有测试可由一个根目录命令运行。
- 测试使用隔离数据库和 Redis，不污染开发数据。
- 主流程的关键失败分支至少包含：错误密码、非法文件、Embedding 失败、低相似度拒答。
- 测试结果稳定，可连续运行三次无随机失败。

## M7：生产容器化

### 必做

- 为 Web、API、Worker 创建多阶段 Dockerfile。
- 创建 `compose.production.yml`，包含 Nginx、Web、API、Worker、PostgreSQL、Redis。
- Nginx 提供统一入口、API 反向代理和前端 history fallback。
- PostgreSQL、Redis、上传目录使用独立持久化 Volume。
- API 和 Worker 以非 root 用户运行，并配置健康检查和重启策略。
- 提供初始化、迁移和启动说明。

### 明确不做

- 不做 Kubernetes、Docker Swarm、多机编排、自动扩缩容和零停机发布。
- 不在 Demo 阶段配置 CDN 和对象存储。

### 验收

- 空白 Docker 环境可按文档构建并启动完整系统。
- 浏览器只需访问 Nginx 暴露的一个地址。
- 重建 Web/API/Worker 容器后数据库、Redis 数据和上传文件仍存在。
- PostgreSQL 与 Redis 不绑定公网端口。

## M8：CI/CD 与自动部署

### 必做

- `ci.yml`：在 PR 和 main push 上执行安装、lint、typecheck、test、build。
- `deploy.yml`：仅在 main 的 CI 成功后构建三个应用镜像并推送 GHCR。
- 镜像同时标记完整 Git SHA 和 `latest`，部署只使用 SHA。
- 通过 SSH 在一台腾讯云 Ubuntu 主机执行迁移、拉取镜像、更新 Compose 和健康检查。
- 部署所需密钥只存放于 GitHub Secrets 和服务器环境文件。
- 部署失败时保留失败日志，并自动恢复上一组应用镜像版本。

### 明确不做

- 不做多环境审批流、蓝绿/金丝雀发布、跨区域部署和 IaC。
- 不自动回滚数据库 migration。
- 不为 fork PR 暴露部署密钥。

### 验收

- PR 能得到明确的 CI 成功/失败结果。
- main 合并后可从提交记录追踪到对应 GHCR 镜像和服务器版本。
- 健康检查成功时部署完成；失败时应用镜像恢复为上一版本。
- 日志和 Actions 输出不包含密钥。

## M9：日志、故障演练与手动回滚

### 必做

- API 和 Worker 输出 JSON 结构化日志。
- 日志至少包含时间、级别、服务、消息，以及适用时的 requestId、jobId、knowledgeBaseId、documentId。
- 提供查看服务状态、API 日志、Worker 日志和资源使用的命令文档。
- 提供 `health-check.sh`、`deploy.sh`、`rollback.sh`。
- 提供手动 GitHub Actions：输入 Git SHA，校验三个镜像存在后执行回滚和健康检查。
- 完成三次演练并记录结果：API 启动失败、Worker 处理失败、错误镜像版本回滚。

### 明确不做

- 不接入 ELK、Loki、Prometheus、Grafana、Sentry、APM 或告警平台。
- 不做数据库 schema 降级脚本和自动数据恢复。
- 不承诺零数据丢失或零停机。

### 验收

- 可以从 requestId 或 jobId 串联一次请求/任务的关键日志。
- 运维文档能指导使用者定位 API 与 Worker 的常见失败。
- 指定一个历史 Git SHA 后，可以恢复三个应用服务并通过健康检查。
- 文档明确说明：应用回滚只切换镜像，数据库 migration 必须向前兼容。

## 4. 最小数据模型边界

只建立 README 已定义的九类表，不增加通用配置表、权限表或事件表：

| 表 | 最小职责 |
| --- | --- |
| `users` | 单管理员身份与密码哈希 |
| `knowledge_bases` | 知识库信息、切片配置、检索配置、模型配置 |
| `documents` | 原始文件信息与当前处理状态 |
| `document_chunks` | 文本、序号、元数据、全文索引、向量 |
| `ingestion_jobs` | 任务进度、尝试次数、错误和时间戳 |
| `conversations` | 一次问答会话的标题和所属知识库 |
| `messages` | 用户问题与 AI 回答 |
| `retrieval_records` | 本次检索结果快照、分数和耗时 |
| `operation_logs` | 登录和知识库/文档写操作审计 |

`operation_logs` 在 M2 建表，在对应写操作中逐步补齐；Demo 不为只读操作记录审计日志。

## 5. 最小页面与接口边界

### 页面

最终只保留以下页面：

1. 登录
2. 仪表盘
3. 知识库列表/编辑
4. 文档列表/上传/Chunk 查看
5. 检索测试台
6. AI 问答与历史记录

仪表盘只展示 README 中已有数据的简单数字和最近记录，不做图表分析、自定义布局和导出。

### API 分组

最终只保留以下 API 分组：

- `/auth`
- `/knowledge-bases`
- `/documents`
- `/ingestion-jobs`
- `/retrieval`
- `/conversations`
- `/dashboard`
- `/health`

不建设公开 API、API Key 管理、Webhook 和版本化开放平台。

## 6. 每个里程碑的完成定义

一个里程碑只有同时满足以下条件才算完成：

- 必做项全部实现，明确不做项没有被偷偷带入。
- lint、typecheck、相关测试和 build 通过。
- 数据库变化包含可执行 migration。
- 新增环境变量同步写入 `.env.example`，不包含真实密钥。
- README 或 `docs/` 中提供足以复现的运行与验收步骤。
- 至少手工走通一次该里程碑的主流程。
- 已知限制被记录，不以“稍后优化”为由阻塞 Demo 主流程。

## 7. 建议执行节奏

按依赖顺序一次只推进一个里程碑：

```text
M1 基础设施
  ↓
M2 基础业务
  ↓
M3 异步入口
  ↓
M4 数据入库
  ↓
M5 用户价值闭环
  ↓
M6 稳定性门槛
  ↓
M7 可交付制品
  ↓
M8 自动交付
  ↓
M9 可运维与可回退
```

每个里程碑建议拆成不超过 5 个小任务，每个任务都应产生一个可验证结果。实际排期取决于开发投入，不在 Demo 路线中预设工期。

## 8. Demo 最终验收脚本

M9 完成后，用以下单一路径进行最终验收：

1. 使用管理员账号登录。
2. 创建一个知识库并保持默认切片与检索配置。
3. 上传一份包含已知答案的 TXT 或 Markdown 文档。
4. 观察任务从待处理推进到已完成，并打开 Chunk 查看内容。
5. 在检索测试台输入问题，确认两路召回和 RRF 结果可见。
6. 在问答页输入同一问题，确认回答流式返回并附带文档/Chunk 引用。
7. 输入文档无法回答的问题，确认系统拒答。
8. 合并一次 main 变更，确认 CI、镜像构建和自动部署成功。
9. 查看 API 与 Worker 日志，使用 requestId/jobId 定位本次操作。
10. 选择上一个 Git SHA 执行回滚，确认健康检查通过且持久化数据仍存在。

完成以上十步即视为最小 Demo 交付完成。任何不影响这条路径的功能均不属于 M1–M9 必做范围。
