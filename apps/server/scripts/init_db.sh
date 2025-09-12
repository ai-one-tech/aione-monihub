#!/bin/bash

# PostgreSQL 数据库初始化脚本
# 用于创建数据库和执行初始化 SQL

set -e

# 数据库配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}
DB_NAME=${DB_NAME:-aione_monihub}

echo "正在初始化 PostgreSQL 数据库..."

# 检查 PostgreSQL 是否运行
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo "错误: PostgreSQL 服务器未运行或无法连接"
    echo "请确保 PostgreSQL 服务器正在运行并且连接参数正确"
    exit 1
fi

# 创建数据库（如果不存在）
echo "创建数据库 $DB_NAME（如果不存在）..."
PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "数据库 $DB_NAME 已存在"

# 执行初始化 SQL 脚本
echo "执行数据库初始化脚本..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/001_initial_schema.sql

echo "数据库初始化完成！"
echo "数据库连接字符串: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"