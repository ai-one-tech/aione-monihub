# Instance ID Migration Summary

## 目标
将 instances 表的 id 列改为自动生成，新增 agent_instance_id 列存储 agent 传入的 instance_id。

## 数据库变更

### 1. 创建迁移文件
- **文件**: `apps/server/migrations/002_add_agent_instance_id.sql`
- **变更**:
  - 添加 `agent_instance_id` 列 (varchar(64), 可空)
  - 添加字段注释
  - 创建索引 `idx_instances_agent_instance_id`

### 2. 表结构变更
```sql
-- 新增列
ALTER TABLE "public"."instances" 
ADD COLUMN "agent_instance_id" varchar(64);

-- 添加注释
COMMENT ON COLUMN "public"."instances"."agent_instance_id" IS 'Agent传入的实例ID，用于与Agent通信';

-- 创建索引
CREATE INDEX "idx_instances_agent_instance_id" ON "public"."instances" USING btree (
  "agent_instance_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
```

## 代码变更

### 1. 数据库实体模型
**文件**: `apps/server/src/entities/instances.rs`
- 在 `Model` 结构体中添加 `agent_instance_id: Option<String>` 字段

### 2. API 模型
**文件**: `apps/server/src/instances/models.rs`
- `InstanceResponse`: 添加 `agent_instance_id` 字段
- `InstanceCreateRequest`: 添加 `agent_instance_id` 字段  
- `InstanceUpdateRequest`: 添加 `agent_instance_id` 字段
- `InstanceListQuery`: 添加 `agent_instance_id` 查询过滤器
- 更新 `from_entity` 和 `to_active_model` 方法

### 3. 实例报告处理器
**文件**: `apps/server/src/instance_reports/handlers.rs`
- 修改实例查找逻辑：通过 `agent_instance_id` 查找现有实例
- 修改实例创建逻辑：生成新的数据库主键，将 agent instance_id 存储在 `agent_instance_id` 字段
- 修改记录插入逻辑：使用数据库主键而非 agent instance_id

### 4. 实例查询处理器  
**文件**: `apps/server/src/instances/handlers.rs`
- 添加对 `agent_instance_id` 的搜索支持
- 添加 `agent_instance_id` 过滤器支持

## 数据流变更

### 实例上报流程
1. Agent 发送 `instance_id`（业务ID）
2. 系统通过 `agent_instance_id` 查找现有实例
3. 如果不存在，创建新实例：
   - 生成新的数据库主键 `id`
   - 将 Agent 的 `instance_id` 存储在 `agent_instance_id` 字段
4. 插入上报记录时使用数据库主键 `id` 作为外键

### 实例查询流程
- 支持通过数据库主键 `id` 查询
- 支持通过业务ID `agent_instance_id` 搜索和过滤
- API 响应同时返回两个字段

## 兼容性
- 现有的 API 接口保持兼容
- 新字段为可选，不影响现有数据
- 支持渐进式迁移

## 测试建议
1. 运行数据库迁移
2. 测试实例上报功能
3. 测试实例查询功能（包括搜索和过滤）
4. 验证 API 响应格式