-- ===================================================================
-- 为 instance_tasks 表添加 application_id 字段
-- 创建时间: 2025-11-10
-- 说明: 添加 application_id 字段用于关联应用，方便查询和过滤
-- ===================================================================

-- -------------------------------------------------------------------
-- 1. 添加 application_id 字段到 instance_tasks 表
-- -------------------------------------------------------------------
ALTER TABLE "public"."instance_tasks" 
ADD COLUMN IF NOT EXISTS "application_id" varchar(64);

-- -------------------------------------------------------------------
-- 2. 添加索引
-- -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_instance_tasks_application_id" ON "public"."instance_tasks" USING btree (
  "application_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- -------------------------------------------------------------------
-- 3. 添加注释
-- -------------------------------------------------------------------
COMMENT ON COLUMN "public"."instance_tasks"."application_id" IS '关联的应用ID，用于标识任务所属的应用';
