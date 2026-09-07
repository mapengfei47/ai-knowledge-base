# M2 登录与知识库管理

## 初始化管理员

在根目录 `.env` 中设置：

```dotenv
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_at_least_10_characters
ADMIN_NAME=Demo Admin
JWT_SECRET=replace_with_at_least_32_random_characters
JWT_EXPIRES_IN_SECONDS=3600
```

应用 migration 并执行幂等 Seed：

```bash
pnpm db:migrate
pnpm db:seed
```

再次运行 Seed 会更新同邮箱管理员的名称和密码，不会创建重复账户。

## 登录与会话

1. `POST /auth/login` 校验邮箱和密码，返回短期 JWT。
2. Redis 使用 `session:{sid}` 保存服务端会话，TTL 与 JWT 有效期一致。
3. 受保护 API 同时校验 JWT 和 Redis 会话。
4. `POST /auth/logout` 删除 Redis 会话，因此旧 JWT 立即失效。
5. Demo 不提供 refresh token；令牌过期后重新登录。

前端将访问令牌放在当前标签页的 `sessionStorage`。任一已认证请求返回 401 时，会统一清除本地状态并跳回登录页。

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/login` | 管理员登录 |
| POST | `/auth/logout` | 退出并撤销 Redis 会话 |
| GET | `/auth/me` | 获取当前管理员 |
| GET | `/knowledge-bases` | 知识库列表 |
| POST | `/knowledge-bases` | 创建知识库 |
| GET | `/knowledge-bases/:id` | 获取知识库 |
| PATCH | `/knowledge-bases/:id` | 修改知识库 |
| DELETE | `/knowledge-bases/:id` | 删除知识库 |

除登录外，以上接口均通过请求头传递 JWT：

```text
Authorization: Bearer <access-token>
```

## 最小业务规则

- 只支持单管理员，不开放注册、邀请和 RBAC。
- 状态只有 `ACTIVE` 和 `DISABLED`。
- `chunkOverlap` 必须小于 `chunkSize`。
- 删除知识库需要前端二次确认；M3 加入文档后沿用级联删除规则。
- 登录、退出以及知识库创建、更新、删除会写入 `operation_logs`。
- 审计日志当前仅写入数据库，不提供独立管理页面。

## 手工验收

1. 未登录访问 `/`，应跳转到 `/login`。
2. 使用 `.env` 中的管理员账号登录。
3. 创建知识库，并在列表中确认配置。
4. 编辑名称或 TopK，刷新后数据仍然存在。
5. 删除知识库，确认列表清空。
6. 退出登录，确认返回登录页且旧 token 请求 `/auth/me` 得到 401。

