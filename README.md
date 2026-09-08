# Knowledge Relay

一个面向个人知识沉淀与 AI 协作的数字化平台：React + NestJS + PostgreSQL + Redis。系统使用 Redis 会话保护知识接口；读取列表和详情时采用 cache-aside，写入、更新和删除后主动使相关缓存失效。

## 架构

```text
Browser → Caddy (HTTPS) → Nginx (React static + /api proxy) → NestJS
                                                              ├─ PostgreSQL
                                                              └─ Redis
```

## 本地启动

要求 Docker 及 Docker Compose：

```bash
docker compose up --build -d
docker compose ps
curl http://localhost:8080/api/health
```

浏览器打开 <http://localhost:8080>。停止服务：

```bash
docker compose down
```

首次启动会创建管理员账号。本地默认账号为 `maxiaofei`、密码为 `maxiaofei1024`；公开部署前建议在 `.env` 中更换为强密码。管理员只会在用户表为空时创建，后续修改环境变量不会覆盖已有账号密码。

数据保存在命名卷中；如确实需要清空本地数据，可执行 `docker compose down -v`。

## 验证 CRUD 与 Redis 缓存

```bash
# 登录并保存会话 Cookie（密码按你的 .env 修改）
curl -c session.cookie -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"maxiaofei","password":"maxiaofei1024","remember":false}'

# 新建
curl -i -X POST http://localhost:8080/api/knowledge \
  -b session.cookie \
  -H 'Content-Type: application/json' \
  -d '{"title":"缓存策略","content":"写操作后删除列表与详情缓存","tag":"redis"}'

# 第一次读取应返回 X-Cache: MISS，第二次为 HIT
curl -i -b session.cookie http://localhost:8080/api/knowledge
curl -i -b session.cookie http://localhost:8080/api/knowledge
```

## 单机上线（Ubuntu 24.04 / 任意云服务器）

1. 准备一台开放 TCP 22/80/443 与 UDP 443 的服务器，并将域名 A/AAAA 记录指向它。
2. 安装 Docker Engine 与 Compose plugin，将本仓库拉到服务器。
3. `cp .env.example .env`，设置强随机 `POSTGRES_PASSWORD`、`ADMIN_PASSWORD` 和真实 `DOMAIN`。
4. 启动：

```bash
docker compose -f compose.yml -f compose.prod.yml up --build -d
docker compose -f compose.yml -f compose.prod.yml ps
curl https://你的域名/api/health
```

Caddy 会自动申请及续签 TLS 证书。数据库与 Redis 不向公网暴露；只有 Caddy 的 80/443 对外开放。

### 使用 DataGrip 连接

生产编排只将 PostgreSQL 与 Redis 端口绑定在服务器 `127.0.0.1`，需通过 SSH tunnel 连接。SSH 主机填写服务器公网 IP、端口 `22`、用户 `ubuntu` 与本机私钥；数据库主机填写 `127.0.0.1`。PostgreSQL 端口为 `5432`，Redis 端口为 `6379`。数据库名、用户名与密码保存在服务器 `/opt/ai-knowledge-base/.env`。

## 常用运维命令

```bash
docker compose logs -f --tail=200 api web
docker compose exec postgres pg_dump -U knowledge knowledge > backup.sql
docker compose pull && docker compose up --build -d
```

## GitHub Actions 自动部署

工作流位于 `.github/workflows/deploy.yml`：Pull Request 只执行验证；推送到 `main` 时，在编译、lint、测试及生产依赖审计全部通过后，通过 SSH 将代码同步到服务器并重新构建容器。服务器上的 `.env` 会被保留，部署结束必须通过服务器本机的完整 HTTPS/Caddy 路径健康检查。之所以不从 GitHub 托管 Runner 直连公网域名，是为了避免海外 Runner 到国内云服务器的 TLS 链路波动造成假失败。

首次启用：

1. 在 GitHub 仓库进入 `Settings → Environments`，创建 `production` Environment；可按需增加 Required reviewers。
2. 在 `production` 的 Environment secrets 中创建 `PRODUCTION_SSH_KEY`。如果当前仓库套餐不支持 Environment secrets，也可在 `Settings → Secrets and variables → Actions` 中创建同名 Repository secret。
3. 在本机执行 `pbcopy < /Users/maxiaofei/.ssh/ai_knowledge_base_deploy`，将剪贴板内容粘贴为 Secret 值；不要将私钥提交到仓库。
4. 提交并推送当前代码到 `main`。之后每次推送都会自动部署，也可在 Actions 页面手动运行 `Verify and deploy`。

服务器 SSH host key 固定保存在 `ops/known_hosts`；若服务器重装导致 host key 改变，核对新指纹后再更新该文件。

上线前至少补齐：云防火墙、每日 PostgreSQL 异地备份、主机监控与告警、依赖漏洞扫描。当前为单管理员模型；如需多人使用，建议继续增加账号管理、密码修改、角色权限与审计日志。
