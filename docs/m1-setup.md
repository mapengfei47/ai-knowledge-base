# M1 本地开发环境

## 环境要求

- Node.js 24+
- pnpm 11+
- Docker Engine / Docker Desktop
- Docker Compose

## 首次启动

```bash
cp .env.example .env
docker compose up -d postgres redis
pnpm install
pnpm db:migrate
pnpm dev
```

启动后访问：

| 服务 | 地址 |
| --- | --- |
| Web | <http://localhost:5173> |
| API 健康检查 | <http://localhost:3000/health> |
| Swagger | <http://localhost:3000/api/docs> |

`pnpm dev` 会先生成 Prisma Client，再并行启动 Web、API 和 Worker。Worker 启动后会监听 `document-ingestion` 文档入库队列。

## 验证命令

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

健康检查成功示例：

```json
{
  "status": "ok",
  "service": "api",
  "dependencies": {
    "postgres": "up",
    "redis": "up"
  }
}
```

## 常用命令

```bash
docker compose ps
docker compose logs -f postgres redis
docker compose down
pnpm db:studio
```

`docker compose down` 不会删除数据卷。只有显式附加 `--volumes` 才会删除本地 PostgreSQL 和 Redis 数据，请谨慎使用。
