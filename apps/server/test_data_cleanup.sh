#!/bin/bash

# 测试数据清理功能的脚本

echo "测试数据清理功能..."

# 检查是否提供了数据库URL参数
if [ -z "$DATABASE_URL" ]; then
    echo "错误: 请设置 DATABASE_URL 环境变量"
    exit 1
fi

# 获取当前时间
CURRENT_TIME=$(date)
echo "当前时间: $CURRENT_TIME"

# 查看 instance_records 表中的记录数量
echo "清理前 instance_records 表中的记录数量:"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM instance_records;"

# 查看7天前的记录数量
echo "7天前的记录数量:"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM instance_records WHERE created_at < NOW() - INTERVAL '7 days';"

echo "测试脚本执行完成"