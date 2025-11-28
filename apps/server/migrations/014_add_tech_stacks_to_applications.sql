-- 为 applications 表新增 tech_stacks 列（JSONB）
ALTER TABLE "public"."applications"
    ADD COLUMN IF NOT EXISTS "tech_stacks" JSONB DEFAULT '[]'::jsonb NOT NULL;