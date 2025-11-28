-- 迁移：将 instances 表的 agent_config 列重命名为 config
-- 兼容处理：仅在存在 agent_config 时执行重命名

DO
$$
BEGIN
    IF
EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'instances'
          AND column_name = 'agent_config'
    ) THEN
ALTER TABLE instances RENAME COLUMN agent_config TO config;
END IF;
END $$;

COMMENT
ON COLUMN instances.config IS '单实例配置（JSON），通过上报接口返回给Agent以覆盖默认配置';