-- 规范化 instances.network_type 历史数据为单值主类型
-- 优先级：wired > wifi > cellular > unknown
-- 说明：将包含多值的字符串（如 "wired,wired,wifi"）归一化为单值字符串，便于枚举/统计

UPDATE "public"."instances"
SET "network_type" = CASE
                         WHEN "network_type" IS NULL THEN NULL
    -- wired 优先
                         WHEN lower("network_type") LIKE '%wired%' OR lower(btrim("network_type")) = 'wired'
                             THEN 'wired'
    -- wifi 次优先（兼容 wi-fi 写法）
                         WHEN lower("network_type") LIKE '%wifi%' OR lower(btrim("network_type")) = 'wifi' OR
                              lower(btrim("network_type")) = 'wi-fi' THEN 'wifi'
    -- cellular 再次优先（兼容 mobile 写法）
                         WHEN lower("network_type") LIKE '%cellular%' OR lower("network_type") LIKE '%mobile%'
                             OR lower(btrim("network_type")) = 'cellular' OR lower(btrim("network_type")) = 'mobile'
                             THEN 'cellular'
    -- 其他值或空字符串归一化为 unknown
                         WHEN lower(btrim("network_type")) IN ('unknown', '') THEN 'unknown'
                         ELSE 'unknown'
    END
WHERE "network_type" IS NOT NULL;

-- 可选：如需后续为该列建立枚举索引或检查约束，可在此添加约束或索引
-- 例如（仅示例，不强制）：
-- ALTER TABLE "public"."instances" ADD CONSTRAINT chk_instances_network_type_valid
--   CHECK ("network_type" IN ('wired', 'wifi', 'cellular', 'unknown'));