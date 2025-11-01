-- 添加 user_management.* 操作权限，并分配给管理员角色
-- 说明：
-- - permission_type 使用 'user_management' 以满足后端检查逻辑
-- - 预生成雪花ID，避免与现有ID冲突
-- - 避免重复插入：permissions 使用 ON CONFLICT(id) DO NOTHING
-- - 避免重复赋权：role_permissions 使用 NOT EXISTS 防重复

-- 插入操作权限
INSERT INTO permissions (
  id, name, permission_resource, permission_action, permission_type,
  menu_path, menu_icon, description, sort_order, created_by, updated_by
) VALUES
  ('1734095616123456601', 'user_management.create', 'user_management', 'create', 'user_management',
    NULL, NULL, '创建用户', NULL, '1734095616123456001', '1734095616123456001'),
  ('1734095616123456602', 'user_management.update', 'user_management', 'update', 'user_management',
    NULL, NULL, '更新用户', NULL, '1734095616123456001', '1734095616123456001'),
  ('1734095616123456603', 'user_management.delete', 'user_management', 'delete', 'user_management',
    NULL, NULL, '删除用户', NULL, '1734095616123456001', '1734095616123456001')
ON CONFLICT (id) DO NOTHING;

-- 赋权给管理员角色（role_id = '1734095616123456101'）
-- 避免重复：检查 UNIQUE(role_id, permission_id)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT '1734095616123456901', '1734095616123456101', '1734095616123456601'
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = '1734095616123456101'
    AND rp.permission_id = '1734095616123456601'
);

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT '1734095616123456902', '1734095616123456101', '1734095616123456602'
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = '1734095616123456101'
    AND rp.permission_id = '1734095616123456602'
);

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT '1734095616123456903', '1734095616123456101', '1734095616123456603'
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = '1734095616123456101'
    AND rp.permission_id = '1734095616123456603'
);