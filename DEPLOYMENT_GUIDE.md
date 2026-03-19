# 企业级CRM系统 - 完整部署指南

## 目录
1. [系统要求](#系统要求)
2. [快速启动（开发环境）](#快速启动)
3. [生产环境部署](#生产部署)
4. [数据库初始化](#数据库初始化)
5. [服务管理](#服务管理)
6. [故障排查](#故障排查)
7. [安全配置](#安全配置)

---

## 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Docker | 24.0+ | 25.0+ |
| Docker Compose | 2.20+ | 2.24+ |
| Node.js（本地开发） | 18.0+ | 20.0+ |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 20GB | 50GB+ |

---

## 快速启动（开发环境）

```bash
# 1. 克隆项目
git clone <repository-url>
cd crm

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改数据库密码、JWT密钥等

# 3. 启动所有基础服务
docker compose up -d

# 4. 等待数据库就绪（约10秒），安装后端依赖并启动
cd packages/backend
npm install
npm run start:dev

# 5. 另开终端，安装前端依赖并启动
cd packages/frontend
npm install
npm run dev
```

**访问地址：**
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000/api/v1
- 默认账号：admin / admin123456

---

## 生产环境部署

### 方式一：使用部署脚本（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
vim .env   # 修改所有密码和密钥！

# 2. 一键启动
chmod +x deploy.sh
./deploy.sh start

# 3. 查看状态
./deploy.sh status

# 4. 查看日志
./deploy.sh logs backend
./deploy.sh logs frontend
```

### 方式二：手动 Docker Compose

```bash
# 构建并启动所有服务
docker compose -f docker-compose.prod.yml up -d --build

# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f backend
```

### 环境变量说明

编辑 `.env` 文件，**必须修改**以下项：

```env
# 数据库密码（强密码，至少16位，包含字母数字符号）
DATABASE_PASSWORD=your_strong_db_password_here

# JWT 密钥（随机字符串，至少64位）
JWT_SECRET=your_64_chars_random_secret_key_here_very_important

# MinIO 密钥
MINIO_SECRET_KEY=your_minio_secret_key_here
```

生成随机密钥的命令：
```bash
openssl rand -hex 32   # 生成64字符十六进制字符串
```

---

## 数据库初始化

数据库在容器首次启动时会自动执行 `scripts/init-db.sql`，完成：
- 创建所有表结构（用户、线索、客户、商机、项目、合同、回款等）
- 创建索引和触发器
- 初始化9种角色（管理员、总裁、技术副总、营销副总、销售经理、销售、项目经理、商务、财务）
- 创建默认管理员账号

### 手动初始化（如需重置）

```bash
# 停止所有服务并删除数据卷
docker compose down -v

# 重新启动（会重新执行初始化脚本）
./deploy.sh start
```

### 修改管理员密码

```bash
# 进入后端容器
docker exec -it crm-backend sh

# 调用密码生成接口（仅开发环境可用）
curl -X POST http://localhost:3000/api/v1/auth/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"password": "your_new_password"}'

# 在数据库中更新
docker exec -it crm-postgres psql -U crm_user crm_db -c \
  "UPDATE users SET password='<hash_from_above>' WHERE username='admin';"
```

---

## 服务管理

### 使用部署脚本

```bash
./deploy.sh start          # 启动所有服务
./deploy.sh stop           # 停止所有服务
./deploy.sh restart        # 重启所有服务
./deploy.sh update         # 更新代码并重新构建（自动备份）
./deploy.sh status         # 查看运行状态
./deploy.sh logs backend   # 查看后端日志
./deploy.sh logs frontend  # 查看前端日志
./deploy.sh backup         # 备份数据库
./deploy.sh restore ./backups/crm_backup_xxx.sql.gz  # 从备份恢复
```

### 直接使用 Docker Compose

```bash
# 重启单个服务
docker compose -f docker-compose.prod.yml restart backend

# 查看实时日志
docker compose -f docker-compose.prod.yml logs -f --tail=100 backend

# 进入容器调试
docker exec -it crm-backend sh
docker exec -it crm-postgres psql -U crm_user crm_db
```

---

## 故障排查

### 1. 登录失败（网络错误）

**原因：** 前端无法连接后端API

**检查步骤：**
```bash
# 检查后端服务状态
docker compose ps backend
docker compose logs backend --tail=50

# 测试 API 是否正常
curl http://localhost:3000/api/v1/health

# 检查前端 .env 配置
cat packages/frontend/.env | grep VITE_API_BASE_URL
```

### 2. 登录成功但不跳转

**原因：** 前后端数据结构不匹配，或路由守卫问题

**检查步骤：**
1. 打开浏览器 F12 → Console，查看报错
2. 查看 Network 标签，检查 `/auth/login` 响应是否包含 `token` 字段
3. 检查 Application → LocalStorage 是否有 `token`

### 3. 数据库连接失败

```bash
# 检查数据库容器状态
docker compose ps postgres

# 检查数据库健康状态
docker compose exec postgres pg_isready -U crm_user

# 查看数据库日志
docker compose logs postgres --tail=50

# 手动连接测试
docker exec -it crm-postgres psql -U crm_user -d crm_db -c "\dt"
```

### 4. 文件导入错误（Failed to resolve import）

```bash
# 清除 Vite 缓存
rm -rf packages/frontend/node_modules/.vite
rm -rf packages/frontend/dist

# 重启前端服务
cd packages/frontend && npm run dev
```

### 5. 权限不足（403 Forbidden）

**检查：** 当前用户角色是否有对应权限，参见 [权限矩阵](#权限矩阵)

---

## 安全配置

### 生产环境清单

- [ ] 修改所有默认密码（数据库、Redis、MinIO、JWT密钥）
- [ ] 启用 HTTPS（在 nginx 配置 SSL 证书）
- [ ] 配置防火墙（只开放 80/443 端口对外，其他服务仅内网访问）
- [ ] 定期备份数据库（`./deploy.sh backup`）
- [ ] 设置 Redis 认证密码
- [ ] 修改管理员默认密码
- [ ] 删除开发环境工具接口（`/auth/generate-hash` 等）

### HTTPS 配置（Nginx）

在 `docker/nginx-crm.conf` 添加 SSL 配置：
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    # ... 其他配置
}
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

---

## 权限矩阵

| 模块 | 管理员 | 总裁 | 技术副总 | 营销副总 | 销售经理 | 销售 | 项目经理 | 商务 | 财务 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 线索（查看） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 线索（分配） | ✅ | ✅ | - | ✅ | ✅ | - | - | - | - |
| 客户（全部） | ✅ | ✅ | 只读 | ✅ | ✅ | 部分 | 只读 | 部分 | 只读 |
| 商机（全部） | ✅ | ✅ | 只读 | ✅ | ✅ | 部分 | 只读 | 部分 | 只读 |
| 项目（全部） | ✅ | ✅ | ✅ | 只读 | 只读 | 只读 | ✅ | 只读 | 只读 |
| 合同（全部） | ✅ | ✅ | 只读 | 部分 | 只读 | 只读 | 只读 | 只读 | 部分 |
| 回款（全部） | ✅ | ✅ | 只读 | 只读 | 只读 | 只读 | 只读 | 只读 | ✅ |
| 用户管理 | ✅ | 只读 | 只读 | 只读 | - | - | - | - | - |

---

## 技术架构

```
前端 (Vue3 + Element Plus)
    ↓ HTTP/HTTPS
Nginx (反向代理 + 静态文件)
    ↓ /api/* → proxy
后端 (NestJS + TypeScript)
    ↓
PostgreSQL (主数据库)
Redis (缓存/Session)
MinIO (文件存储)
```

## 默认端口

| 服务 | 容器内端口 | 对外端口（可配置） |
|------|----------|-----------------|
| 前端 (Nginx) | 80 | 80 (FRONTEND_PORT) |
| 后端 (NestJS) | 3000 | 不对外暴露 |
| PostgreSQL | 5432 | 5432 (DATABASE_PORT) |
| Redis | 6379 | 6379 (REDIS_PORT) |
| MinIO API | 9000 | 9000 (MINIO_PORT) |
| MinIO 控制台 | 9001 | 9001 |
