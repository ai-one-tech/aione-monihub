# Rust 服务器 DuckDB 到 PostgreSQL 数据库迁移（使用 SeaORM）

## Core Features

- 数据库驱动更换

- SeaORM 集成

- 实体模型定义

- 数据迁移工具

- 模块代码更新

- 环境变量配置

- 编译警告修复

## Tech Stack

{
  "Backend": {
    "language": "Rust",
    "framework": "Actix-web 4.0",
    "database": "PostgreSQL",
    "orm": "SeaORM",
    "driver": "sea-orm with sqlx-postgres",
    "connection_pool": "SeaORM 内置连接池",
    "config": "dotenv 环境变量管理"
  }
}

## Design

使用 SeaORM 框架进行数据库迁移，提供类型安全的数据库操作和自动化的实体管理。保持现有项目架构，通过 SeaORM 的实体和活动记录模式重构数据库操作代码。使用 dotenv 管理环境变量配置。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] 更新项目依赖，添加 SeaORM 和 PostgreSQL 相关 crate

[X] 安装 SeaORM CLI 工具并配置数据库连接

[X] 移除所有 SQLite 和 DuckDB 相关代码

[X] 创建 PostgreSQL 数据库和表结构

[X] 使用 SeaORM 生成实体模型文件

[X] 重构数据库连接管理模块，集成 SeaORM

[X] 配置环境变量管理（dotenv）

[X] 开发数据迁移工具，将 DuckDB 数据导入到 PostgreSQL

[X] 修复所有编译警告和错误

[X] 更新所有业务模块使用 SeaORM 实体进行数据库操作

[X] 验证所有模块功能并进行集成测试
