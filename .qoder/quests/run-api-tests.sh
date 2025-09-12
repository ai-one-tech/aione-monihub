#!/bin/bash

# 自动化API测试套件
# 定期执行API健康检查和性能测试

echo "开始执行自动化API测试套件..."

# 创建测试报告目录
REPORTS_DIR="/Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/reports"
mkdir -p $REPORTS_DIR

# 生成时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="$REPORTS_DIR/$TIMESTAMP"
mkdir -p $REPORT_DIR

echo "测试报告将保存到: $REPORT_DIR"

# 执行健康检查
echo "1. 执行健康检查..."
/Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-health-check.sh > $REPORT_DIR/health-check.log 2>&1

# 保存健康检查结果
cp /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-health-report.json $REPORT_DIR/

# 执行性能测试
echo "2. 执行性能测试..."
/Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-test.sh > $REPORT_DIR/performance-test.log 2>&1

# 保存性能测试结果
cp /Users/billy/SourceCode/ai-one-tech/aione-monihub/.qoder/quests/api-performance-report.json $REPORT_DIR/

# 生成测试摘要报告
echo "{
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"health_check\": {
    \"report_file\": \"$REPORT_DIR/api-health-report.json\",
    \"log_file\": \"$REPORT_DIR/health-check.log\"
  },
  \"performance_test\": {
    \"report_file\": \"$REPORT_DIR/api-performance-report.json\",
    \"log_file\": \"$REPORT_DIR/performance-test.log\"
  }
}" > $REPORT_DIR/test-summary.json

echo "测试完成!"
echo "测试摘要报告: $REPORT_DIR/test-summary.json"