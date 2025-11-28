-- Alter configs: add generate_values and schema, update comments
ALTER TABLE "public"."configs"
    ADD COLUMN "generate_values" boolean NOT NULL DEFAULT false,
    ADD COLUMN "schema"          jsonb   NULL;

COMMENT ON COLUMN "public"."configs"."generate_values" IS '是否生成选项值，仅当 config_type = array 时生效';
COMMENT ON COLUMN "public"."configs"."schema" IS '对象/数组的 JSON Schema，供结构声明与校验（可选）';
COMMENT ON COLUMN "public"."configs"."config_type" IS '配置类型：object, array, html, text';

-- Create table: config_values
CREATE TABLE "public"."config_values"
(
    "id"          varchar(64) COLLATE "pg_catalog"."default"  NOT NULL,
    "config_id"   varchar(64) COLLATE "pg_catalog"."default"  NOT NULL,
    "config_code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
    "environment" varchar(50) COLLATE "pg_catalog"."default"  NOT NULL,
    "version"     int4                                        NOT NULL,
    "value_code"  varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
    "value_name"  varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
    "value_data"  jsonb                                       NULL,
    "revision"    int4                                        NOT NULL DEFAULT 1,
    "deleted_at"  timestamptz(3)                              NULL,
    "created_at"  timestamptz(3)                              NOT NULL DEFAULT now(),
    "updated_at"  timestamptz(3)                              NOT NULL DEFAULT now(),
    CONSTRAINT "config_values_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "config_values_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "public"."configs" ("id") ON DELETE CASCADE
);

COMMENT ON TABLE "public"."config_values" IS '配置选项值表，存储 array 类型配置的结构化选项值，支持软删除与乐观锁';
COMMENT ON COLUMN "public"."config_values"."value_code" IS '选项编码（数组项中的 code），在未软删数据中唯一';
COMMENT ON COLUMN "public"."config_values"."revision" IS '乐观锁修订号，每次更新加1';
COMMENT ON COLUMN "public"."config_values"."deleted_at" IS '软删除时间戳；NULL 表示有效';

-- Indexes
CREATE INDEX "idx_cfg_values_cfg_id" ON "public"."config_values" USING btree ("config_id");
CREATE INDEX "idx_cfg_values_cfg_code_env_ver" ON "public"."config_values" USING btree ("config_code", "environment", "version");
CREATE INDEX "idx_cfg_values_value_code" ON "public"."config_values" USING btree ("value_code");
CREATE INDEX "idx_cfg_values_deleted_at" ON "public"."config_values" USING btree ("deleted_at");

-- Partial unique index for active (not soft-deleted) rows
CREATE UNIQUE INDEX "uniq_cfg_values_active"
    ON "public"."config_values" ("config_code", "environment", "version", "value_code")
    WHERE "deleted_at" IS NULL;

-- Trigger to auto-update updated_at
CREATE TRIGGER "update_config_values_updated_at"
    BEFORE UPDATE
    ON "public"."config_values"
    FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();