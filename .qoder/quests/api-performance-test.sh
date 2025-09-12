#!/bin/bash

# API性能测试脚本
# 对所有API端点进行性能测试

echo "开始执行API性能测试..."

# 服务器配置
BASE_URL="http://localhost:9080"
TOKEN=""

# 登录获取token
echo "获取认证token..."
login_response=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "password"}')
    
login_http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "password"}')
    
if [ "$login_http_code" == "200" ]; then
    TOKEN=$(echo $login_response | jq -r '.token')
    echo "✓ 认证成功"
else
    echo "✗ 认证失败"
    exit 1
fi

# 性能测试函数
performance_test() {
    local endpoint=$1
    local method=$2
    local auth_required=$3
    local data=$4
    
    echo "测试端点: $method $endpoint"
    
    # 准备curl命令
    local curl_cmd="curl -s -o /dev/null -w '%{time_total}' $BASE_URL$endpoint -X $method"
    
    # 添加认证头（如果需要）
    if [ "$auth_required" == "true" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    # 添加内容类型和数据（如果有）
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    # 执行5次测试
    local total_time=0
    for i in {1..5}; do
        local response_time=$(eval $curl_cmd)
        # 将秒转换为毫秒
        local response_time_ms=$(echo "$response_time * 1000" | bc -l | xargs printf "%.0f")
        total_time=$((total_time + response_time_ms))
        echo "  请求 $i: ${response_time_ms}ms"
    done
    
    # 计算平均响应时间
    local avg_time=$((total_time / 5))
    echo "  平均响应时间: ${avg_time}ms"
    
    # 保存结果到文件
    echo "$method $endpoint: ${avg_time}ms" >> /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-results.txt
}

# 执行性能测试
echo "执行性能测试..."

# 健康检查端点
performance_test "/health" "GET" "false" ""

# 用户管理模块
performance_test "/api/users" "GET" "true" ""

# 项目管理模块
performance_test "/api/projects" "GET" "true" ""

# 应用管理模块
performance_test "/api/applications" "GET" "true" ""

# 部署管理模块
performance_test "/api/deployments" "GET" "true" ""

# 机器管理模块
performance_test "/api/machines" "GET" "true" ""

# 配置管理模块
performance_test "/api/configs" "GET" "true" ""

# 角色权限模块
performance_test "/api/roles" "GET" "true" ""

# 权限管理模块
performance_test "/api/permissions" "GET" "true" ""

# 日志管理模块
performance_test "/api/v1/logs" "GET" "true" ""

# 输出性能测试结果
echo ""
echo "==================== 性能测试结果 ===================="
cat /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-results.txt
echo "======================================================"

# 生成性能测试报告
echo "{
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"results\": {
" > /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-report.json

# 读取结果文件并生成JSON
first=true
while IFS= read -r line; do
    if [ "$first" == "true" ]; then
        first=false
    else
        echo "    ," >> /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-report.json
    fi
    
    # 解析行内容
    endpoint=$(echo "$line" | cut -d':' -f1 | xargs)
    avg_time=$(echo "$line" | cut -d':' -f2 | tr -d 'ms' | xargs)
    
    # 转义endpoint中的引号
    escaped_endpoint=$(echo "$endpoint" | sed 's/"/\\"/g')
    
    echo "    \"$escaped_endpoint\": $avg_time" >> /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-report.json
done < /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-results.txt

echo "  }
}" >> /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-report.json

echo "性能测试报告已生成到: /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-report.json"