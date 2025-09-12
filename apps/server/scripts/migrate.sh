#!/bin/bash

# 数据迁移脚本
# 从 DuckDB 迁移数据到 PostgreSQL

set -e

echo "🚀 开始数据迁移流程..."

# 检查环境
if [ ! -f ".env" ]; then
    echo "❌ 未找到 .env 文件，请先配置数据库连接"
    exit 1
fi

# 加载环境变量
source .env

echo "📋 迁移步骤："
echo "1. 导出 DuckDB 数据"
echo "2. 创建 PostgreSQL 表结构"
echo "3. 迁移数据到 PostgreSQL"
echo ""

# 步骤 1: 导出 DuckDB 数据
echo "📤 步骤 1: 导出 DuckDB 数据..."
if [ -f "scripts/export_duckdb.py" ]; then
    cd scripts
    python3 export_duckdb.py
    cd ..
else
    echo "⚠️  未找到 DuckDB 导出脚本，跳过导出步骤"
fi

# 步骤 2: 创建 PostgreSQL 表结构
echo "🏗️  步骤 2: 创建 PostgreSQL 表结构..."
if command -v psql &> /dev/null; then
    # 提取数据库信息
    DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
    if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        echo "📊 连接到数据库: $DB_HOST:$DB_PORT/$DB_NAME"
        
        # 检查数据库是否存在，如果不存在则创建
        export PGPASSWORD="$DB_PASS"
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
            echo "🆕 创建数据库: $DB_NAME"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
        fi
        
        # 执行表结构创建
        if [ -f "migrations/001_initial_schema.sql" ]; then
            echo "📋 执行表结构创建..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f migrations/001_initial_schema.sql
            echo "✅ 表结构创建完成"
        else
            echo "❌ 未找到表结构文件: migrations/001_initial_schema.sql"
            exit 1
        fi
    else
        echo "❌ DATABASE_URL 格式不正确"
        exit 1
    fi
else
    echo "⚠️  未安装 psql，跳过表结构创建"
    echo "请手动执行: psql -d $DATABASE_URL -f migrations/001_initial_schema.sql"
fi

# 步骤 3: 运行数据迁移工具
echo "🔄 步骤 3: 运行数据迁移工具..."
cargo run --bin migrate_data

echo ""
echo "🎉 数据迁移完成！"
echo "📊 可以使用以下命令验证数据："
echo "   psql -d \"$DATABASE_URL\" -c \"SELECT COUNT(*) FROM users;\""
echo "   psql -d \"$DATABASE_URL\" -c \"SELECT COUNT(*) FROM projects;\""