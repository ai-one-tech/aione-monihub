# Rust 服务器 DuckDB 到 PostgreSQL 数据库迁移

## Core Features

- 数据库驱动更换

- 连接池管理

- 数据迁移工具

- 模块代码更新

- SQL语法适配

## Tech Stack

{
  "Backend": {
    "language": "Rust",
    "framework": "Actix-web 4.0",
    "database": "PostgreSQL",
    "driver": "tokio-postgres + sqlx",
    "connection_pool": "deadpool-postgres"
  }
}

## Design

后端数据库迁移项目，保持现有项目架构，仅替换底层数据库驱动从 DuckDB 到 PostgreSQL。使用异步连接池提升并发性能，确保所有业务模块正常运行。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[ ] 更新项目依赖，添加 PostgreSQL 相关 crate 并移除 DuckDB 依赖

[ ] 重构数据库连接管理模块，实现 PostgreSQL 连接池配置

[ ] 创建 PostgreSQL 数据库表结构迁移脚本

[ ] 开发数据迁移工具，将 DuckDB 数据导出并导入到 PostgreSQL

[ ] 更新用户和角色权限模块的数据库操作代码

[ ] 更新项目和应用模块的数据库操作代码

[ ] 更新部署、日志、机器和配置模块的数据库操作代码

[ ] 验证所有模块功能并进行集成测试
