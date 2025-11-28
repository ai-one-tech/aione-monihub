-- 修复 permissions.permission_action 枚举值异常及可空性
-- 1) 将非操作类型（menu/page）的 permission_action 置为空
-- 2) 规范现有枚举值为 snake_case 小写
-- 3) 放宽列约束，允许空值（便于菜单/页面类型不需要动作）

-- 允许空值
ALTER TABLE public.permissions
    ALTER COLUMN permission_action DROP NOT NULL;

-- 将非操作类型的动作置空
UPDATE public.permissions
SET permission_action = NULL
WHERE permission_type IN ('menu', 'page');

-- 统一大小写为小写
UPDATE public.permissions
SET permission_action = LOWER(permission_action)
WHERE permission_action IS NOT NULL;

-- 将不在枚举允许范围内的值置空，避免 ORM 解析错误
UPDATE public.permissions
SET permission_action = NULL
WHERE permission_action IS NOT NULL
  AND permission_action NOT IN ('create', 'read', 'update', 'delete', 'execute');