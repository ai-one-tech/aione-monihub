-- 为instances表添加在线状态字段
ALTER TABLE "public"."instances"
    ADD COLUMN IF NOT EXISTS "online_status" varchar(50) DEFAULT 'offline' NOT NULL;

-- 添加注释
COMMENT ON COLUMN "public"."instances"."online_status" IS '实例在线状态：online(在线), offline(离线)';

-- 添加索引
CREATE INDEX IF NOT EXISTS "idx_instances_online_status" ON "public"."instances" USING btree (
                                                                                              "online_status"
                                                                                              COLLATE "pg_catalog"."default"
                                                                                              "pg_catalog"."text_ops"
                                                                                              ASC NULLS LAST
    );