#!/bin/bash

# API健康检查脚本
# 根据设计文档执行完整的API健康检查

echo "开始执行API健康检查..."

# 服务器配置
BASE_URL="http://localhost:9080"
TOKEN=""

# 检查结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 性能统计
TOTAL_RESPONSE_TIME=0

# 打印结果函数
print_result() {
    local test_name=$1
    local status=$2
    local response_time=$3
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" == "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        if [ ! -z "$response_time" ]; then
            TOTAL_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME + response_time))
            echo "✓ $test_name: 通过 (响应时间: ${response_time}ms)"
        else
            echo "✓ $test_name: 通过"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ ! -z "$response_time" ]; then
            echo "✗ $test_name: 失败 (响应时间: ${response_time}ms)"
        else
            echo "✗ $test_name: 失败"
        fi
    fi
}

# 1. 基础服务检查
echo "1. 执行基础服务检查..."

# 检查健康端点
start_time=$(date +%s%3N)
response=$(curl -s -w "%{http_code}" $BASE_URL/health)
end_time=$(date +%s%3N)
response_time=$((end_time - start_time))
http_code=${response: -3}
if [ "$http_code" == "200" ]; then
    print_result "健康检查端点" "PASS" "$response_time"
else
    print_result "健康检查端点" "FAIL" "$response_time"
fi

# 2. 认证模块检查
echo "2. 执行认证模块检查..."

# 登录测试
start_time=$(date +%s%3N)
login_response=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "password"}')
end_time=$(date +%s%3N)
response_time=$((end_time - start_time))
    
start_time=$(date +%s%3N)
login_http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "password"}')
end_time=$(date +%s%3N)
login_response_time=$((end_time - start_time))
    
if [ "$login_http_code" == "200" ]; then
    print_result "用户登录" "PASS" "$login_response_time"
    # 提取token用于后续测试
    TOKEN=$(echo $login_response | jq -r '.token')
else
    print_result "用户登录" "FAIL" "$login_response_time"
fi

# 3. 用户管理模块检查
echo "3. 执行用户管理模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取用户列表
    users_response=$(curl -s -w "%{http_code}" $BASE_URL/api/users \
        -H "Authorization: Bearer $TOKEN")
    users_http_code=${users_response: -3}
    if [ "$users_http_code" == "200" ]; then
        print_result "获取用户列表" "PASS"
    else
        print_result "获取用户列表" "FAIL"
    fi
else
    print_result "获取用户列表" "FAIL"
fi

# 4. 项目管理模块检查
echo "4. 执行项目管理模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取项目列表
    projects_response=$(curl -s -w "%{http_code}" $BASE_URL/api/projects \
        -H "Authorization: Bearer $TOKEN")
    projects_http_code=${projects_response: -3}
    if [ "$projects_http_code" == "200" ]; then
        print_result "获取项目列表" "PASS"
    else
        print_result "获取项目列表" "FAIL"
    fi
else
    print_result "获取项目列表" "FAIL"
fi

# 5. 应用管理模块检查
echo "5. 执行应用管理模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取应用列表
    applications_response=$(curl -s -w "%{http_code}" $BASE_URL/api/applications \
        -H "Authorization: Bearer $TOKEN")
    applications_http_code=${applications_response: -3}
    if [ "$applications_http_code" == "200" ]; then
        print_result "获取应用列表" "PASS"
    else
        print_result "获取应用列表" "FAIL"
    fi
else
    print_result "获取应用列表" "FAIL"
fi

# 6. 部署管理模块检查
echo "6. 执行部署管理模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取部署列表
    deployments_response=$(curl -s -w "%{http_code}" $BASE_URL/api/deployments \
        -H "Authorization: Bearer $TOKEN")
    deployments_http_code=${deployments_response: -3}
    if [ "$deployments_http_code" == "200" ]; then
        print_result "获取部署列表" "PASS"
    else
        print_result "获取部署列表" "FAIL"
    fi
else
    print_result "获取部署列表" "FAIL"
fi

# 7. 机器管理模块检查
echo "7. 执行机器管理模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取机器列表
    machines_response=$(curl -s -w "%{http_code}" $BASE_URL/api/machines \
        -H "Authorization: Bearer $TOKEN")
    machines_http_code=${machines_response: -3}
    if [ "$machines_http_code" == "200" ]; then
        print_result "获取机器列表" "PASS"
    else
        print_result "获取机器列表" "FAIL"
    fi
else
    print_result "获取机器列表" "FAIL"
fi

# 8. 配置管理模块检查
echo "8. 执行配置管理模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取配置列表
    configs_response=$(curl -s -w "%{http_code}" $BASE_URL/api/configs \
        -H "Authorization: Bearer $TOKEN")
    configs_http_code=${configs_response: -3}
    if [ "$configs_http_code" == "200" ]; then
        print_result "获取配置列表" "PASS"
    else
        print_result "获取配置列表" "FAIL"
    fi
else
    print_result "获取配置列表" "FAIL"
fi

# 9. 角色权限模块检查
echo "9. 执行角色权限模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取角色列表
    roles_response=$(curl -s -w "%{http_code}" $BASE_URL/api/roles \
        -H "Authorization: Bearer $TOKEN")
    roles_http_code=${roles_response: -3}
    if [ "$roles_http_code" == "200" ]; then
        print_result "获取角色列表" "PASS"
    else
        print_result "获取角色列表" "FAIL"
    fi
else
    print_result "获取角色列表" "FAIL"
fi

# 10. 日志管理模块检查
echo "10. 执行日志管理模块检查..."

if [ ! -z "$TOKEN" ]; then
    # 获取日志列表
    logs_response=$(curl -s -w "%{http_code}" $BASE_URL/api/v1/logs \
        -H "Authorization: Bearer $TOKEN")
    logs_http_code=${logs_response: -3}
    if [ "$logs_http_code" == "200" ]; then
        print_result "获取日志列表" "PASS"
    else
        print_result "获取日志列表" "FAIL"
    fi
else
    print_result "获取日志列表" "FAIL"
fi

# 11. WebSocket模块检查
echo "11. 执行WebSocket模块检查..."

# 这里只做连接测试，实际的WebSocket测试需要更复杂的实现
websocket_response=$(curl -s -w "%{http_code}" -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" $BASE_URL/api/websocket/terminal/1)
websocket_http_code=${websocket_response: -3}
if [ "$websocket_http_code" == "101" ]; then
    # 101表示协议切换成功，这是WebSocket连接的正常响应
    print_result "WebSocket连接" "PASS"
else
    print_result "WebSocket连接" "FAIL"
fi

# 输出最终结果
echo ""
echo "==================== 测试结果 ===================="
echo "总测试数: $TOTAL_TESTS"
echo "通过测试: $PASSED_TESTS"
echo "失败测试: $FAILED_TESTS"
echo "通过率: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
echo "=================================================="

# 生成JSON格式的报告
echo "{
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"total_tests\": $TOTAL_TESTS,
  \"passed_tests\": $PASSED_TESTS,
  \"failed_tests\": $FAILED_TESTS,
  \"pass_rate\": $(echo "scale=4; $PASSED_TESTS / $TOTAL_TESTS" | bc),
  \"modules\": {
    \"health\": {
      \"total\": 1,
      \"passed\": $(if [ "$(curl -s -w "%{http_code}" $BASE_URL/health | tail -c 3)" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$(curl -s -w "%{http_code}" $BASE_URL/health | tail -c 3)" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"auth\": {
      \"total\": 1,
      \"passed\": $(if [ "$login_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$login_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"users\": {
      \"total\": 1,
      \"passed\": $(if [ "$users_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$users_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"projects\": {
      \"total\": 1,
      \"passed\": $(if [ "$projects_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$projects_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"applications\": {
      \"total\": 1,
      \"passed\": $(if [ "$applications_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$applications_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"deployments\": {
      \"total\": 1,
      \"passed\": $(if [ "$deployments_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$deployments_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"machines\": {
      \"total\": 1,
      \"passed\": $(if [ "$machines_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$machines_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"configs\": {
      \"total\": 1,
      \"passed\": $(if [ "$configs_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$configs_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"roles\": {
      \"total\": 1,
      \"passed\": $(if [ "$roles_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$roles_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"logs\": {
      \"total\": 1,
      \"passed\": $(if [ "$logs_http_code" == "200" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$logs_http_code" == "200" ]; then echo "0"; else echo "1"; fi)
    },
    \"websocket\": {
      \"total\": 1,
      \"passed\": $(if [ "$websocket_http_code" == "101" ]; then echo "1"; else echo "0"; fi),
      \"failed\": $(if [ "$websocket_http_code" == "101" ]; then echo "0"; else echo "1"; fi)
    }
  }
}" > /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-health-report.json

echo "详细报告已生成到: /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-health-report.json"