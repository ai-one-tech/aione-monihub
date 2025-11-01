-- 统一状态字段，将所有状态值标准化为 active 或 disabled
-- 迁移日期: 2025-11-01

-- 更新用户表中的状态字段
-- 将 inactive, invited, suspended 统一改为 disabled
UPDATE users
SET status = 'disabled'
WHERE status IN ('inactive', 'invited', 'suspended');

-- 更新项目表中的状态字段
-- 将 inactive, archived 统一改为 disabled
UPDATE projects
SET status = 'disabled'
WHERE status IN ('inactive', 'archived');

-- 更新应用表中的状态字段
-- 将 inactive, archived, maintenance 统一改为 disabled
UPDATE applications
SET status = 'disabled'
WHERE status IN ('inactive', 'archived', 'maintenance');

-- 更新实例表中的状态字段
-- 将 inactive, maintenance 统一改为 disabled
UPDATE instances
SET status = 'disabled'
WHERE status IN ('inactive', 'maintenance');

-- 验证更新结果
DO $$
DECLARE
    invalid_users INTEGER;
    invalid_projects INTEGER;
    invalid_applications INTEGER;
    invalid_instances INTEGER;
BEGIN
    -- 检查是否还有无效的状态值
    SELECT COUNT(*) INTO invalid_users FROM users WHERE status NOT IN ('active', 'disabled');
    SELECT COUNT(*) INTO invalid_projects FROM projects WHERE status NOT IN ('active', 'disabled');
    SELECT COUNT(*) INTO invalid_applications FROM applications WHERE status NOT IN ('active', 'disabled');
    SELECT COUNT(*) INTO invalid_instances FROM instances WHERE status NOT IN ('active', 'disabled');
    
    -- 输出检查结果
    RAISE NOTICE '状态字段标准化完成:';
    RAISE NOTICE '  用户表无效状态记录数: %', invalid_users;
    RAISE NOTICE '  项目表无效状态记录数: %', invalid_projects;
    RAISE NOTICE '  应用表无效状态记录数: %', invalid_applications;
    RAISE NOTICE '  实例表无效状态记录数: %', invalid_instances;
    
    -- 如果还有无效状态，抛出异常
    IF invalid_users > 0 OR invalid_projects > 0 OR invalid_applications > 0 OR invalid_instances > 0 THEN
        RAISE EXCEPTION '仍存在无效的状态值，请检查数据';
    END IF;
END $$;
