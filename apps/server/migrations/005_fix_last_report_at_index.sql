-- 修复 instances 表的 idx_instances_last_report_at 索引定义
-- 之前的迁移中该索引错误地指向了 first_report_at

-- 删除错误索引（如果存在）
DROP INDEX IF EXISTS "idx_instances_last_report_at";

-- 创建正确的索引，指向 last_report_at 字段
CREATE INDEX IF NOT EXISTS "idx_instances_last_report_at" ON "public"."instances" USING btree (
  "last_report_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);

-- 备注：离线巡检依赖 last_report_at 的时间范围筛选，该索引可优化批量更新的选择阶段