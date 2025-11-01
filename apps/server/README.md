# AiOne MoniHub Server

基于 Rust + Actix-web + SeaORM + PostgreSQL 的监控平台后端服务。

## 数据库设置

### 1. 安装 PostgreSQL

确保您的系统已安装 PostgreSQL 数据库服务器。

**macOS (使用 Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 创建数据库用户（可选）

```bash
# 连接到 PostgreSQL
sudo -u postgres psql

# 创建用户和数据库
CREATE USER aione_user WITH PASSWORD 'your_password';
CREATE DATABASE aione_monihub OWNER aione_user;
GRANT ALL PRIVILEGES ON DATABASE aione_monihub TO aione_user;
\q
```

### 3. 配置环境变量

复制环境变量示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，设置正确的数据库连接信息：
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/aione_monihub
```

### 4. 初始化数据库

运行数据库初始化脚本：
```bash
# 使用默认配置
./scripts/init_db.sh

# 或者指定自定义配置
DB_HOST=localhost DB_PORT=5432 DB_USER=postgres DB_PASSWORD=password DB_NAME=aione_monihub ./scripts/init_db.sh
```

## 开发

### 编译项目

```bash
cargo build
```

### 运行服务器

```bash
cargo run
cargo watch -w src -x 'run'
```

服务器将在 `http://127.0.0.1:9080` 启动。

### API 文档

启动服务器后，访问 `http://127.0.0.1:9080/swagger-ui/` 查看 API 文档。

## 项目结构

```
src/
├── main.rs              # 应用入口点
├── lib.rs               # 库入口
├── shared/              # 共享模块
│   ├── database.rs      # 数据库连接管理
│   └── error.rs         # 错误处理
├── users/               # 用户管理模块
├── projects/            # 项目管理模块
├── applications/        # 应用管理模块
├── configs/             # 配置管理模块
├── deployments/         # 部署管理模块
├── roles/               # 角色管理模块
├── permissions/         # 权限管理模块
├── instances/            # 实例管理模块
├── logs/                # 日志管理模块
├── websocket/           # WebSocket 服务
└── health/              # 健康检查

migrations/              # 数据库迁移脚本
scripts/                 # 工具脚本
```

## 数据库表结构

项目包含以下主要数据表：

- `users` - 用户表
- `projects` - 项目表
- `applications` - 应用表
- `configs` - 配置表
- `deployments` - 部署表
- `roles` - 角色表
- `permissions` - 权限表
- `user_roles` - 用户角色关联表
- `instances` - 实例表
- `logs` - 日志表

详细的表结构请参考 `migrations/001_initial_schema.sql` 文件。