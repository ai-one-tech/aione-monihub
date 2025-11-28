-- 添加 agent_instance_id 列到 instances 表
-- 将 id 列改为自增主键，agent_instance_id 存储 agent 传入的 instance_id

-- 首先添加 agent_instance_id 列
ALTER TABLE "public"."instances"
    ADD COLUMN "agent_instance_id" varchar(64);

-- 添加注释
COMMENT
ON COLUMN "public"."instances"."agent_instance_id" IS 'Agent传入的实例ID，用于与Agent通信';

-- 创建索引以提高查询性能
CREATE INDEX "idx_instances_agent_instance_id" ON "public"."instances" USING btree (
    "agent_instance_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
    );

-- 可选：添加唯一约束，确保 agent_instance_id 唯一（如果业务需要）
-- ALTER TABLE "public"."instances" ADD CONSTRAINT "instances_agent_instance_id_key" UNIQUE ("agent_instance_id");