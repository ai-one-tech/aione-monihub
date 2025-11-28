-- ===================================================================
-- 实例信息上报与远程控制功能数据库迁移
-- 创建时间: 2025-11-03
-- 说明: 新增实例上报记录表、任务表、任务执行记录表，扩展实例表字段
-- ===================================================================

-- -------------------------------------------------------------------
-- 1. 扩展 instances 表，添加实时状态字段
-- -------------------------------------------------------------------
ALTER TABLE "public"."instances"
    ADD COLUMN IF NOT EXISTS "agent_type"             varchar(50),
    ADD COLUMN IF NOT EXISTS "agent_version"          varchar(50),
    ADD COLUMN IF NOT EXISTS "cpu_usage_percent"      decimal(5, 2),
    ADD COLUMN IF NOT EXISTS "memory_usage_percent"   decimal(5, 2),
    ADD COLUMN IF NOT EXISTS "disk_usage_percent"     decimal(5, 2),
    ADD COLUMN IF NOT EXISTS "process_uptime_seconds" bigint,
    ADD COLUMN IF NOT EXISTS "network_type"           varchar(50);

-- 添加索引
CREATE INDEX IF NOT EXISTS "idx_instances_agent_type" ON "public"."instances" USING btree (
                                                                                           "agent_type"
                                                                                           COLLATE "pg_catalog"."default"
                                                                                           "pg_catalog"."text_ops" ASC
                                                                                           NULLS LAST
    );

-- 添加注释
COMMENT ON COLUMN "public"."instances"."agent_type" IS 'Agent类型：java, golang, rust, javascript, app';
COMMENT ON COLUMN "public"."instances"."agent_version" IS 'Agent版本号';
COMMENT ON COLUMN "public"."instances"."cpu_usage_percent" IS '最新CPU使用率（0-100）';
COMMENT ON COLUMN "public"."instances"."memory_usage_percent" IS '最新内存使用率（0-100）';
COMMENT ON COLUMN "public"."instances"."disk_usage_percent" IS '最新磁盘使用率（0-100）';
COMMENT ON COLUMN "public"."instances"."process_uptime_seconds" IS '最新Agent运行时长（秒）';
COMMENT ON COLUMN "public"."instances"."network_type" IS '上网方式：wired(有线), wifi(无线), mobile(移动网络), vpn';

-- -------------------------------------------------------------------
-- 2. 创建实例上报记录表 (instance_records)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."instance_records"
(
    "id"                     varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
    "instance_id"            varchar(64) COLLATE "pg_catalog"."default" NOT NULL,

    -- Agent 信息
    "agent_type"             varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
    "agent_version"          varchar(50) COLLATE "pg_catalog"."default",

    -- 系统信息
    "os_type"                varchar(100) COLLATE "pg_catalog"."default",
    "os_version"             varchar(100) COLLATE "pg_catalog"."default",
    "hostname"               varchar(255) COLLATE "pg_catalog"."default",

    -- 网络信息
    "ip_address"             inet,
    "public_ip"              inet,
    "mac_address"            varchar(255) COLLATE "pg_catalog"."default",
    "network_type"           varchar(50) COLLATE "pg_catalog"."default",

    -- 硬件资源信息
    "cpu_model"              varchar(255) COLLATE "pg_catalog"."default",
    "cpu_cores"              int4,
    "cpu_usage_percent"      decimal(5, 2),
    "memory_total_mb"        bigint,
    "memory_used_mb"         bigint,
    "memory_usage_percent"   decimal(5, 2),
    "disk_total_gb"          bigint,
    "disk_used_gb"           bigint,
    "disk_usage_percent"     decimal(5, 2),

    -- 运行状态
    "process_id"             int4,
    "process_uptime_seconds" bigint,
    "thread_count"           int4,

    -- 扩展信息
    "custom_metrics"         jsonb                                               DEFAULT '{}'::jsonb,

    -- 时间信息
    "report_timestamp"       timestamptz(3)                             NOT NULL,
    "received_at"            timestamptz(3)                             NOT NULL DEFAULT now(),
    "created_at"             timestamptz(3)                             NOT NULL DEFAULT now(),

    CONSTRAINT "pk_instance_records" PRIMARY KEY ("id")
);

-- 添加索引
CREATE INDEX IF NOT EXISTS "idx_instance_records_instance_id" ON "public"."instance_records" USING btree (
                                                                                                          "instance_id"
                                                                                                          COLLATE "pg_catalog"."default"
                                                                                                          "pg_catalog"."text_ops"
                                                                                                          ASC NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_records_report_timestamp" ON "public"."instance_records" USING btree (
                                                                                                               "report_timestamp"
                                                                                                               "pg_catalog"."timestamptz_ops"
                                                                                                               DESC
                                                                                                               NULLS
                                                                                                               LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_records_instance_time" ON "public"."instance_records" USING btree (
                                                                                                            "instance_id"
                                                                                                            COLLATE "pg_catalog"."default"
                                                                                                            "pg_catalog"."text_ops"
                                                                                                            ASC NULLS
                                                                                                            LAST,
                                                                                                            "report_timestamp"
                                                                                                            "pg_catalog"."timestamptz_ops"
                                                                                                            DESC NULLS
                                                                                                            LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_records_agent_type" ON "public"."instance_records" USING btree (
                                                                                                         "agent_type"
                                                                                                         COLLATE "pg_catalog"."default"
                                                                                                         "pg_catalog"."text_ops"
                                                                                                         ASC NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_records_received_at" ON "public"."instance_records" USING btree (
                                                                                                          "received_at"
                                                                                                          "pg_catalog"."timestamptz_ops"
                                                                                                          DESC NULLS
                                                                                                          LAST
    );

-- 添加注释
COMMENT ON TABLE "public"."instance_records" IS '实例上报记录表，存储每次Agent上报的完整历史数据';
COMMENT ON COLUMN "public"."instance_records"."id" IS '记录唯一标识（雪花ID）';
COMMENT ON COLUMN "public"."instance_records"."instance_id" IS '关联的实例ID';
COMMENT ON COLUMN "public"."instance_records"."agent_type" IS 'Agent类型：java, golang, rust, javascript, app';
COMMENT ON COLUMN "public"."instance_records"."agent_version" IS 'Agent版本号';
COMMENT ON COLUMN "public"."instance_records"."os_type" IS '操作系统类型：Linux, Windows, macOS, Android, iOS';
COMMENT ON COLUMN "public"."instance_records"."os_version" IS '操作系统版本';
COMMENT ON COLUMN "public"."instance_records"."hostname" IS '主机名';
COMMENT ON COLUMN "public"."instance_records"."ip_address" IS '内网IP地址';
COMMENT ON COLUMN "public"."instance_records"."public_ip" IS '公网IP地址';
COMMENT ON COLUMN "public"."instance_records"."mac_address" IS 'MAC地址';
COMMENT ON COLUMN "public"."instance_records"."network_type" IS '上网方式：wired(有线), wifi(无线), mobile(移动网络), vpn';
COMMENT ON COLUMN "public"."instance_records"."cpu_model" IS 'CPU型号';
COMMENT ON COLUMN "public"."instance_records"."cpu_cores" IS 'CPU核心数';
COMMENT ON COLUMN "public"."instance_records"."cpu_usage_percent" IS 'CPU使用率（0-100）';
COMMENT ON COLUMN "public"."instance_records"."memory_total_mb" IS '总内存（MB）';
COMMENT ON COLUMN "public"."instance_records"."memory_used_mb" IS '已用内存（MB）';
COMMENT ON COLUMN "public"."instance_records"."memory_usage_percent" IS '内存使用率（0-100）';
COMMENT ON COLUMN "public"."instance_records"."disk_total_gb" IS '总磁盘空间（GB）';
COMMENT ON COLUMN "public"."instance_records"."disk_used_gb" IS '已用磁盘空间（GB）';
COMMENT ON COLUMN "public"."instance_records"."disk_usage_percent" IS '磁盘使用率（0-100）';
COMMENT ON COLUMN "public"."instance_records"."process_id" IS 'Agent进程ID';
COMMENT ON COLUMN "public"."instance_records"."process_uptime_seconds" IS 'Agent运行时长（秒）';
COMMENT ON COLUMN "public"."instance_records"."thread_count" IS '线程数';
COMMENT ON COLUMN "public"."instance_records"."custom_metrics" IS '自定义指标（JSON格式）';
COMMENT ON COLUMN "public"."instance_records"."report_timestamp" IS 'Agent端上报时间戳';
COMMENT ON COLUMN "public"."instance_records"."received_at" IS '服务端接收时间';
COMMENT ON COLUMN "public"."instance_records"."created_at" IS '记录创建时间';

-- -------------------------------------------------------------------
-- 3. 创建实例任务表 (instance_tasks)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."instance_tasks"
(
    "id"               varchar(64) COLLATE "pg_catalog"."default"  NOT NULL,
    "task_name"        varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
    "task_type"        varchar(50) COLLATE "pg_catalog"."default"  NOT NULL,
    "target_instances" jsonb                                       NOT NULL,
    "task_content"     jsonb                                       NOT NULL,
    "priority"         int4                                                 DEFAULT 5,
    "timeout_seconds"  int4                                                 DEFAULT 300,
    "retry_count"      int4                                                 DEFAULT 0,
    "created_by"       varchar(64) COLLATE "pg_catalog"."default"  NOT NULL,
    "created_at"       timestamptz(3)                              NOT NULL DEFAULT now(),
    "updated_at"       timestamptz(3)                              NOT NULL DEFAULT now(),
    "deleted_at"       timestamptz(3),

    CONSTRAINT "pk_instance_tasks" PRIMARY KEY ("id")
);

-- 添加索引
CREATE INDEX IF NOT EXISTS "idx_instance_tasks_created_at" ON "public"."instance_tasks" USING btree (
                                                                                                     "created_at"
                                                                                                     "pg_catalog"."timestamptz_ops"
                                                                                                     DESC NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_tasks_task_type" ON "public"."instance_tasks" USING btree (
                                                                                                    "task_type"
                                                                                                    COLLATE "pg_catalog"."default"
                                                                                                    "pg_catalog"."text_ops"
                                                                                                    ASC NULLS LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_tasks_deleted_at" ON "public"."instance_tasks" USING btree (
                                                                                                     "deleted_at"
                                                                                                     "pg_catalog"."timestamptz_ops"
                                                                                                     ASC NULLS LAST
    );

-- 添加注释
COMMENT ON TABLE "public"."instance_tasks" IS '实例任务表，存储任务定义和目标实例列表';
COMMENT ON COLUMN "public"."instance_tasks"."id" IS '任务唯一标识（雪花ID）';
COMMENT ON COLUMN "public"."instance_tasks"."task_name" IS '任务名称';
COMMENT ON COLUMN "public"."instance_tasks"."task_type" IS '任务类型：shell_exec, internal_cmd, file_upload, file_download, file_browse, file_view, file_delete';
COMMENT ON COLUMN "public"."instance_tasks"."target_instances" IS '目标实例ID数组（JSON格式）';
COMMENT ON COLUMN "public"."instance_tasks"."task_content" IS '任务内容（JSON格式，根据任务类型不同而不同）';
COMMENT ON COLUMN "public"."instance_tasks"."priority" IS '优先级（1-10，10最高）';
COMMENT ON COLUMN "public"."instance_tasks"."timeout_seconds" IS '超时时长（秒）';
COMMENT ON COLUMN "public"."instance_tasks"."retry_count" IS '重试次数';
COMMENT ON COLUMN "public"."instance_tasks"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."instance_tasks"."created_at" IS '创建时间';
COMMENT ON COLUMN "public"."instance_tasks"."updated_at" IS '更新时间';
COMMENT ON COLUMN "public"."instance_tasks"."deleted_at" IS '软删除时间';

-- -------------------------------------------------------------------
-- 4. 创建实例任务执行记录表 (instance_task_records)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."instance_task_records"
(
    "id"             varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
    "task_id"        varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
    "instance_id"    varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
    "status"         varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
    "dispatch_time"  timestamptz(3),
    "start_time"     timestamptz(3),
    "end_time"       timestamptz(3),
    "duration_ms"    bigint,
    "result_code"    int4,
    "result_message" text COLLATE "pg_catalog"."default",
    "result_data"    jsonb                                               DEFAULT '{}'::jsonb,
    "error_message"  text COLLATE "pg_catalog"."default",
    "retry_attempt"  int4                                                DEFAULT 0,
    "created_at"     timestamptz(3)                             NOT NULL DEFAULT now(),
    "updated_at"     timestamptz(3)                             NOT NULL DEFAULT now(),

    CONSTRAINT "pk_instance_task_records" PRIMARY KEY ("id")
);

-- 添加索引
CREATE INDEX IF NOT EXISTS "idx_instance_task_records_task_id" ON "public"."instance_task_records" USING btree (
                                                                                                                "task_id"
                                                                                                                COLLATE "pg_catalog"."default"
                                                                                                                "pg_catalog"."text_ops"
                                                                                                                ASC
                                                                                                                NULLS
                                                                                                                LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_task_records_instance_id" ON "public"."instance_task_records" USING btree (
                                                                                                                    "instance_id"
                                                                                                                    COLLATE "pg_catalog"."default"
                                                                                                                    "pg_catalog"."text_ops"
                                                                                                                    ASC
                                                                                                                    NULLS
                                                                                                                    LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_task_records_task_instance" ON "public"."instance_task_records" USING btree (
                                                                                                                      "task_id"
                                                                                                                      COLLATE "pg_catalog"."default"
                                                                                                                      "pg_catalog"."text_ops"
                                                                                                                      ASC
                                                                                                                      NULLS
                                                                                                                      LAST,
                                                                                                                      "instance_id"
                                                                                                                      COLLATE "pg_catalog"."default"
                                                                                                                      "pg_catalog"."text_ops"
                                                                                                                      ASC
                                                                                                                      NULLS
                                                                                                                      LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_task_records_status" ON "public"."instance_task_records" USING btree (
                                                                                                               "status"
                                                                                                               COLLATE "pg_catalog"."default"
                                                                                                               "pg_catalog"."text_ops"
                                                                                                               ASC NULLS
                                                                                                               LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_task_records_instance_status" ON "public"."instance_task_records" USING btree (
                                                                                                                        "instance_id"
                                                                                                                        COLLATE "pg_catalog"."default"
                                                                                                                        "pg_catalog"."text_ops"
                                                                                                                        ASC
                                                                                                                        NULLS
                                                                                                                        LAST,
                                                                                                                        "status"
                                                                                                                        COLLATE "pg_catalog"."default"
                                                                                                                        "pg_catalog"."text_ops"
                                                                                                                        ASC
                                                                                                                        NULLS
                                                                                                                        LAST
    );
CREATE INDEX IF NOT EXISTS "idx_instance_task_records_created_at" ON "public"."instance_task_records" USING btree (
                                                                                                                   "created_at"
                                                                                                                   "pg_catalog"."timestamptz_ops"
                                                                                                                   DESC
                                                                                                                   NULLS
                                                                                                                   LAST
    );

-- 添加注释
COMMENT ON TABLE "public"."instance_task_records" IS '实例任务执行记录表，存储每个实例对每个任务的执行情况';
COMMENT ON COLUMN "public"."instance_task_records"."id" IS '记录唯一标识（雪花ID）';
COMMENT ON COLUMN "public"."instance_task_records"."task_id" IS '关联的任务ID';
COMMENT ON COLUMN "public"."instance_task_records"."instance_id" IS '关联的实例ID';
COMMENT ON COLUMN "public"."instance_task_records"."status" IS '执行状态：pending, dispatched, running, success, failed, timeout, cancelled';
COMMENT ON COLUMN "public"."instance_task_records"."dispatch_time" IS '任务下发时间';
COMMENT ON COLUMN "public"."instance_task_records"."start_time" IS '开始执行时间';
COMMENT ON COLUMN "public"."instance_task_records"."end_time" IS '执行结束时间';
COMMENT ON COLUMN "public"."instance_task_records"."duration_ms" IS '执行耗时（毫秒）';
COMMENT ON COLUMN "public"."instance_task_records"."result_code" IS '结果代码（0成功，非0失败）';
COMMENT ON COLUMN "public"."instance_task_records"."result_message" IS '结果消息';
COMMENT ON COLUMN "public"."instance_task_records"."result_data" IS '结果数据（JSON格式）';
COMMENT ON COLUMN "public"."instance_task_records"."error_message" IS '错误信息（失败时）';
COMMENT ON COLUMN "public"."instance_task_records"."retry_attempt" IS '当前重试次数';
COMMENT ON COLUMN "public"."instance_task_records"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."instance_task_records"."updated_at" IS '记录更新时间';

-- -------------------------------------------------------------------
-- 5. 添加外键约束（可选，根据实际需求决定是否启用）
-- -------------------------------------------------------------------
-- ALTER TABLE "public"."instance_records" 
--   ADD CONSTRAINT "fk_instance_records_instance" 
--   FOREIGN KEY ("instance_id") REFERENCES "public"."instances"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."instance_task_records" 
--   ADD CONSTRAINT "fk_instance_task_records_task" 
--   FOREIGN KEY ("task_id") REFERENCES "public"."instance_tasks"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."instance_task_records" 
--   ADD CONSTRAINT "fk_instance_task_records_instance" 
--   FOREIGN KEY ("instance_id") REFERENCES "public"."instances"("id") ON DELETE CASCADE;
