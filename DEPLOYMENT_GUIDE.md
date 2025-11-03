# AiOne MoniHub 实例信息上报与远程控制功能 - 快速部署指南

## 部署前准备

### 环境要求
- PostgreSQL 12+
- Rust 1.70+（服务端）
- JDK 1.8+（Agent）
- Maven 3.6+（Agent）

## 一、数据库部署

### 1. 执行迁移脚本

```bash
# 进入服务端目录
cd apps/server

# 执行数据库迁移
psql -U your_username -d aione_monihub -f migrations/003_instance_report_and_control.sql
```

### 2. 验证表创建

```sql
-- 检查新表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('instance_records', 'instance_tasks', 'instance_task_records');

-- 应该返回3行记录
```

### 3. 检查实例表扩展

```sql
-- 验证instances表新增字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'instances' 
AND column_name IN ('agent_type', 'agent_version', 'cpu_usage_percent');

-- 应该返回新增的字段
```

## 二、服务端部署

### 1. 编译服务端

```bash
cd apps/server

# 开发环境
cargo build

# 生产环境
cargo build --release
```

### 2. 配置环境变量

编辑 `.env` 文件或设置环境变量：

```bash
# 数据库连接
DATABASE_URL=postgresql://username:password@localhost:5432/aione_monihub

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=9080

# JWT密钥
JWT_SECRET=your-secret-key-here
```

### 3. 启动服务

```bash
# 开发环境
cargo run

# 生产环境
./target/release/aione-monihub-server
```

### 4. 验证服务

```bash
# 健康检查
curl http://localhost:9080/health

# 应该返回 {"status":"ok"}
```

## 三、创建测试实例

在使用Agent前，需要先在服务端创建实例记录。

### 方法1：通过API创建（需要JWT Token）

```bash
# 1. 先登录获取token
TOKEN=$(curl -X POST http://localhost:9080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  | jq -r '.token')

# 2. 创建实例
curl -X POST http://localhost:9080/api/instances \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Instance",
    "instance_type": "prod",
    "status": "active",
    "application_id": "your-application-id"
  }'

# 记录返回的instance_id，Agent需要使用
```

### 方法2：通过数据库直接插入

```sql
INSERT INTO instances (
  id, name, hostname, ip_address, status, environment, 
  application_id, created_by, updated_by, created_at, updated_at
) VALUES (
  'test-instance-001',  -- 这个ID将用于Agent配置
  'Test Instance',
  'test-host',
  '192.168.1.100',
  'active',
  'prod',
  'your-application-id',
  'system',
  'system',
  NOW(),
  NOW()
);
```

## 四、Agent部署

### 1. 编译Agent

```bash
cd apps/agent/java

# 编译打包
mvn clean package
```

### 2. 配置Agent

创建 `application-prod.yml`：

```yaml
monihub:
  agent:
    # ⚠️ 必须填写：使用上一步创建的实例ID
    instance-id: test-instance-001
    
    # 服务端地址
    server-url: http://localhost:9080
    
    # Agent信息
    agent-type: java
    agent-version: 1.0.0
    
    # 上报配置
    report:
      enabled: true
      interval-seconds: 60
    
    # 任务配置（暂未完全实现，可以禁用）
    task:
      enabled: false

# 日志配置
logging:
  level:
    root: INFO
    tech.aione.monihub.agent: DEBUG
```

### 3. 启动Agent

```bash
# 使用生产配置启动
java -jar target/aione-monihub-agent-java-0.1.0.jar \
  --spring.profiles.active=prod

# 或者直接指定配置文件
java -jar target/aione-monihub-agent-java-0.1.0.jar \
  --spring.config.location=application-prod.yml
```

### 4. 验证Agent运行

查看日志应该看到：

```
Starting AiOne MoniHub Agent...
Initializing InstanceReportService
Starting instance report service, interval: 60 seconds
Agent started successfully
```

## 五、功能验证

### 1. 验证上报功能

等待Agent运行60秒后，查询上报历史：

```bash
# 获取上报记录（需要token）
curl -X GET "http://localhost:9080/api/instances/test-instance-001/reports?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

应该返回包含上报数据的JSON响应。

### 2. 查看实例状态更新

```sql
-- 检查实例表是否更新了最新状态
SELECT 
  id, name, 
  agent_type, 
  cpu_usage_percent, 
  memory_usage_percent, 
  last_report_at, 
  report_count 
FROM instances 
WHERE id = 'test-instance-001';
```

应该看到：
- `agent_type` = 'java'
- `last_report_at` 为最近时间
- `report_count` > 0
- CPU、内存使用率有数值

### 3. 测试任务创建和下发

```bash
# 创建一个Shell执行任务
curl -X POST http://localhost:9080/api/instances/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "测试Shell命令",
    "task_type": "shell_exec",
    "target_instances": ["test-instance-001"],
    "task_content": {
      "command": "echo Hello from MoniHub",
      "working_dir": "/tmp"
    },
    "priority": 5,
    "timeout_seconds": 60
  }'

# 记录返回的task_id

# 查询任务执行状态
curl -X GET "http://localhost:9080/api/instances/tasks/{task_id}/records" \
  -H "Authorization: Bearer $TOKEN"
```

注意：任务执行功能需要Agent启用task.enabled=true并重启。

### 4. 测试长轮询

```bash
# 模拟Agent拉取任务（会等待最多30秒）
time curl -X GET "http://localhost:9080/api/open/instances/test-instance-001/tasks?wait=true&timeout=30"
```

如果有pending任务，会立即返回；否则等待30秒后返回空列表。

## 六、生产环境部署建议

### 1. 服务端

```bash
# 使用systemd管理服务
sudo cat > /etc/systemd/system/monihub-server.service << EOF
[Unit]
Description=AiOne MoniHub Server
After=network.target postgresql.service

[Service]
Type=simple
User=monihub
WorkingDirectory=/opt/monihub/server
Environment="DATABASE_URL=postgresql://user:pass@localhost/aione_monihub"
Environment="SERVER_HOST=0.0.0.0"
Environment="SERVER_PORT=9080"
ExecStart=/opt/monihub/server/aione-monihub-server
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable monihub-server
sudo systemctl start monihub-server
```

### 2. Agent

```bash
# 使用systemd管理Agent
sudo cat > /etc/systemd/system/monihub-agent.service << EOF
[Unit]
Description=AiOne MoniHub Java Agent
After=network.target

[Service]
Type=simple
User=monihub
WorkingDirectory=/opt/monihub/agent
ExecStart=/usr/bin/java -jar /opt/monihub/agent/aione-monihub-agent-java-0.1.0.jar --spring.config.location=/opt/monihub/agent/application-prod.yml
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable monihub-agent
sudo systemctl start monihub-agent
```

### 3. 数据库优化

```sql
-- 为历史数据创建分区表（可选，数据量大时）
CREATE TABLE instance_records_2025_11 PARTITION OF instance_records
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- 定期清理旧数据
DELETE FROM instance_records 
WHERE created_at < NOW() - INTERVAL '3 months';
```

### 4. 监控配置

使用Prometheus监控：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'monihub-server'
    static_configs:
      - targets: ['localhost:9080']
    metrics_path: '/metrics'  # 需要添加metrics端点
```

## 七、故障排查

### 问题1：Agent上报失败

**现象**：日志显示 "Instance report failed"

**排查**：
```bash
# 1. 检查instance_id是否存在
psql -d aione_monihub -c "SELECT id, name FROM instances WHERE id='your-instance-id';"

# 2. 测试网络连通性
curl http://server-url:9080/health

# 3. 手动测试上报接口
curl -X POST http://localhost:9080/api/open/instances/report \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"test-instance-001",...}'
```

### 问题2：任务一直pending

**现象**：任务创建后状态一直是pending

**排查**：
```bash
# 1. 检查Agent是否启用task功能
grep "task.enabled" application-prod.yml

# 2. 检查Agent是否在运行
ps aux | grep monihub-agent

# 3. 测试任务拉取接口
curl "http://localhost:9080/api/open/instances/test-instance-001/tasks"
```

### 问题3：数据库连接失败

**现象**：服务启动报错 "Failed to initialize database connection"

**排查**：
```bash
# 1. 测试数据库连接
psql -U username -d aione_monihub -c "SELECT 1;"

# 2. 检查DATABASE_URL格式
echo $DATABASE_URL

# 3. 检查PostgreSQL日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 八、性能调优

### 1. 数据库索引

```sql
-- 检查索引使用情况
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('instance_records', 'instance_task_records')
ORDER BY idx_scan DESC;

-- 如果某些索引未使用，考虑删除
```

### 2. Agent配置优化

```yaml
monihub:
  agent:
    report:
      # 降低上报频率以减轻服务器压力
      interval-seconds: 120  # 改为2分钟
    
    task:
      # 增加长轮询超时以减少请求
      long-poll-timeout-seconds: 60
```

### 3. 服务端并发

```rust
// 在main.rs中调整worker线程数
HttpServer::new(move || {
    // ...
})
.workers(4)  // 设置worker数量
.bind(&bind_address)?
```

## 九、安全加固

### 1. 限制开放API访问

```rust
// 在middleware.rs中添加IP白名单
let allowed_ips = vec!["192.168.1.0/24", "10.0.0.0/8"];
```

### 2. 启用HTTPS

```bash
# 使用nginx作为反向代理
upstream monihub {
    server localhost:9080;
}

server {
    listen 443 ssl;
    server_name monihub.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://monihub;
    }
}
```

### 3. 数据库权限控制

```sql
-- 创建只读用户用于查询
CREATE USER monihub_readonly WITH PASSWORD 'password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monihub_readonly;
```

## 十、备份恢复

### 备份

```bash
# 备份数据库
pg_dump -U username aione_monihub > backup_$(date +%Y%m%d).sql

# 仅备份新增的表
pg_dump -U username -t instance_records -t instance_tasks -t instance_task_records aione_monihub > backup_new_tables.sql
```

### 恢复

```bash
# 恢复数据库
psql -U username aione_monihub < backup_20251103.sql
```

---

**部署完成后，您的AiOne MoniHub平台将具备完整的实例监控和远程控制能力！**
