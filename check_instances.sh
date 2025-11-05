#!/bin/bash

# 检查是否有实例ID的信息
echo "尝试从Swagger文档查看API信息："
echo "打开浏览器访问: http://localhost:9080/swagger-ui/index.html"
echo ""
echo "或者使用curl测试一个虚拟实例ID的错误信息："
curl -s "http://localhost:9080/api/open/instances/test-instance-id/tasks" 2>&1 | head -20
