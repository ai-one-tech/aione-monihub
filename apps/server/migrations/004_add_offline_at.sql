-- ===================================================================
-- 为 instances 表增加离线时间字段，并添加相关索引
-- 创建时间: 2025-11-09
-- 说明: 添加 offline_at 字段用于记录实例被判定为离线的时间
-- ===================================================================

-- 添加 offline_at 字段（毫秒精度）
ALTER TABLE "public"."instances"
ADD COLUMN IF NOT EXISTS "offline_at" timestamptz(3);

-- 为 offline_at 添加索引，便于统计与查询
CREATE INDEX IF NOT EXISTS "idx_instances_offline_at" ON "public"."instances" USING btree (
  "offline_at" "pg_catalog"."timestamptz_ops" DESC NULLS LAST
);

-- 可选：为 status 与 last_report_at 建立复合索引（提升巡检查询性能）
-- 如需启用请取消注释
-- CREATE INDEX IF NOT EXISTS "idx_instances_status_last_report" ON "public"."instances" USING btree (
--   "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
--   "last_report_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
-- );