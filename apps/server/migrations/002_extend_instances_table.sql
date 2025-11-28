-- 扩展 instances 表新增字段
-- 新增的字段包括：
-- - mac_address: 计算机网卡标识
-- - public_ip: 公网IP地址
-- - port: 通信端口号
-- - program_path: 程序运行路径
-- - os_type: 操作系统类型
-- - os_version: 操作系统版本
-- - first_report_at: 首次上报时间
-- - last_report_at: 末次上报时间
-- - report_count: 上报次数
-- - custom_fields: 自定义字段 (JSONB)
-- - application_id: 应用ID

-- 添加新列
ALTER TABLE "public"."instances"
    ADD COLUMN IF NOT EXISTS "application_id"  varchar(64),
    ADD COLUMN IF NOT EXISTS "mac_address"     varchar(255),
    ADD COLUMN IF NOT EXISTS "public_ip"       inet,
    ADD COLUMN IF NOT EXISTS "port"            int4,-- 扩展 instances 表新增字段
-- 新增的字段包括：
-- - mac_address: 计算机网卡标识
-- - public_ip: 公网IP地址
-- - port: 通信端口号
-- - program_path: 程序运行路径
-- - os_type: 操作系统类型
-- - os_version: 操作系统版本
-- - first_report_at: 首次上报时间
-- - last_report_at: 末次上报时间
-- - report_count: 上报次数
-- - custom_fields: 自定义字段 (JSONB)
-- - application_id: 应用ID

    ADD COLUMN IF NOT EXISTS "application_id"  varchar(64),
    ADD COLUMN IF NOT EXISTS "mac_address"     varchar(255),
    ADD COLUMN IF NOT EXISTS "public_ip"       inet,
    ADD COLUMN IF NOT EXISTS "port"            int4,
    ADD COLUMN IF NOT EXISTS "program_path"    varchar(512),
    ADD COLUMN IF NOT EXISTS "os_type"         varchar(100),
    ADD COLUMN IF NOT EXISTS "os_version"      varchar(100),
    ADD COLUMN IF NOT EXISTS "first_report_at" timestamptz(3),
    ADD COLUMN IF NOT EXISTS "last_report_at"  timestamptz(3),
    ADD COLUMN IF NOT EXISTS "report_count"    int4  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "custom_fields"   jsonb DEFAULT '{}'::jsonb;

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS "idx_instances_application_id" ON "public"."instances" USING btree (
                                                                                               "application_id"
                                                                                               COLLATE "pg_catalog"."default"
                                                                                               "pg_catalog"."text_ops"
                                                                                               ASC NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_mac_address" ON "public"."instances" USING btree (
                                                                                            "mac_address"
                                                                                            COLLATE "pg_catalog"."default"
                                                                                            "pg_catalog"."text_ops" ASC
                                                                                            NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_public_ip" ON "public"."instances" USING btree (
                                                                                          "public_ip"
                                                                                          "pg_catalog"."inet_ops" ASC
                                                                                          NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_port" ON "public"."instances" USING btree (
                                                                                     "port" "pg_catalog"."int4_ops" ASC
                                                                                     NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_os_type" ON "public"."instances" USING btree (
                                                                                        "os_type"
                                                                                        COLLATE "pg_catalog"."default"
                                                                                        "pg_catalog"."text_ops" ASC
                                                                                        NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_os_version" ON "public"."instances" USING btree (
                                                                                           "os_version"
                                                                                           COLLATE "pg_catalog"."default"
                                                                                           "pg_catalog"."text_ops" ASC
                                                                                           NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_last_report_at" ON "public"."instances" USING btree (
                                                                                               "first_report_at"
                                                                                               "pg_catalog"."timestamptz_ops"
                                                                                               ASC NULLS LAST
    );

-- 添加注释说明
COMMENT ON COLUMN "public"."instances"."application_id" IS '应用ID';
COMMENT ON COLUMN "public"."instances"."mac_address" IS '计算机网卡标识（MAC地址）';
COMMENT ON COLUMN "public"."instances"."public_ip" IS '实例公网IP地址';
COMMENT ON COLUMN "public"."instances"."port" IS '实例通信端口号';
COMMENT ON COLUMN "public"."instances"."program_path" IS '程序运行路径';
COMMENT ON COLUMN "public"."instances"."os_type" IS '操作系统类型';
COMMENT ON COLUMN "public"."instances"."os_version" IS '操作系统版本';
COMMENT ON COLUMN "public"."instances"."last_report_at" IS '末次上报时间';
COMMENT ON COLUMN "public"."instances"."report_count" IS '上报次数统计';
COMMENT ON COLUMN "public"."instances"."custom_fields" IS '自定义字段（JSONB格式）';

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS "idx_instances_application_id" ON "public"."instances" USING btree (
                                                                                               "application_id"
                                                                                               COLLATE "pg_catalog"."default"
                                                                                               "pg_catalog"."text_ops"
                                                                                               ASC NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_mac_address" ON "public"."instances" USING btree (
                                                                                            "mac_address"
                                                                                            COLLATE "pg_catalog"."default"
                                                                                            "pg_catalog"."text_ops" ASC
                                                                                            NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_public_ip" ON "public"."instances" USING btree (
                                                                                          "public_ip"
                                                                                          "pg_catalog"."inet_ops" ASC
                                                                                          NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_port" ON "public"."instances" USING btree (
                                                                                     "port" "pg_catalog"."int4_ops" ASC
                                                                                     NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_os_type" ON "public"."instances" USING btree (
                                                                                        "os_type"
                                                                                        COLLATE "pg_catalog"."default"
                                                                                        "pg_catalog"."text_ops" ASC
                                                                                        NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_os_version" ON "public"."instances" USING btree (
                                                                                           "os_version"
                                                                                           COLLATE "pg_catalog"."default"
                                                                                           "pg_catalog"."text_ops" ASC
                                                                                           NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instances_last_report_at" ON "public"."instances" USING btree (
                                                                                               "first_report_at"
                                                                                               "pg_catalog"."timestamptz_ops"
                                                                                               ASC NULLS LAST
    );

-- 添加注释说明
COMMENT ON COLUMN "public"."instances"."application_id" IS '应用ID';
COMMENT ON COLUMN "public"."instances"."mac_address" IS '计算机网卡标识（MAC地址）';
COMMENT ON COLUMN "public"."instances"."public_ip" IS '实例公网IP地址';
COMMENT ON COLUMN "public"."instances"."port" IS '实例通信端口号';
COMMENT ON COLUMN "public"."instances"."program_path" IS '程序运行路径';
COMMENT ON COLUMN "public"."instances"."os_type" IS '操作系统类型';
COMMENT ON COLUMN "public"."instances"."os_version" IS '操作系统版本';
COMMENT ON COLUMN "public"."instances"."last_report_at" IS '末次上报时间';
COMMENT ON COLUMN "public"."instances"."report_count" IS '上报次数统计';
COMMENT ON COLUMN "public"."instances"."custom_fields" IS '自定义字段（JSONB格式）';
