-- 添加 aconfig 字段到 instances 表（JSON 配置，用于下发 Agent 端配置）
ALTER TABLE "public"."instances"
    ADD COLUMN IF NOT EXISTS "config" jsonb NULL;

COMMENT
ON COLUMN "public"."instances"."config" IS '单实例的Agent配置（JSON），通过上报接口返回给Agent以覆盖默认配置';

