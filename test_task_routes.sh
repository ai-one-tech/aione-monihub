#!/bin/bash

# 测试任务拉取API的路由
echo "=== 测试任务拉取API ==="
echo ""
echo "测试URL: http://localhost:9080/api/open/instances/3ASDFASDF/tasks?wait=true&timeout=30"
echo ""
curl -v "http://localhost:9080/api/open/instances/3ASDFASDF/tasks?wait=true&timeout=30" 2>&1 | head -30

echo ""
echo "=== 检查实例是否存在（需要token）==="
echo "假设你有一个有效的token，可以运行："
echo 'curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:9080/api/instances/3ASDFASDF'
