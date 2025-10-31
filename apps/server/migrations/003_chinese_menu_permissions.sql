-- 添加中文菜单权限数据
-- 这个迁移文件用于更新现有菜单权限为中文，并添加新的AiOne MoniHub功能菜单

-- 首先更新现有的菜单权限为中文描述
UPDATE permissions SET 
  description = '仪表板',
  menu_path = '/dashboard',
  updated_by = '1734095616123456001'
WHERE name = 'menu.dashboard';

-- 更新其他现有菜单权限
UPDATE permissions SET 
  name = 'menu.projects',
  description = '项目管理',
  menu_path = '/projects',
  menu_icon = 'ListTodo',
  updated_by = '1734095616123456001'
WHERE name = 'menu.tasks';

UPDATE permissions SET 
  name = 'menu.applications',
  description = '应用管理', 
  menu_path = '/applications',
  menu_icon = 'Package',
  updated_by = '1734095616123456001'
WHERE name = 'menu.apps';

-- 插入新的菜单权限数据
INSERT INTO permissions (id, name, permission_resource, permission_action, permission_type, menu_path, menu_icon, description, sort_order, created_by, updated_by) VALUES

-- 新增的主菜单权限
('1734095616123456404', 'menu.instances', 'menu', 'read', 'menu', '/instances', 'Monitor', '实例管理', 8, '1734095616123456001', '1734095616123456001'),
('1734095616123456405', 'menu.deployments', 'menu', 'read', 'menu', '/deployments', 'ServerOff', '部署管理', 9, '1734095616123456001', '1734095616123456001'),

-- 日志菜单（父菜单）
('1734095616123456406', 'menu.logs', 'menu', 'read', 'menu', '/logs', 'FileX', '日志管理', 10, '1734095616123456001', '1734095616123456001'),

-- 日志子菜单
('1734095616123456411', 'menu.logs.system', 'menu', 'read', 'menu', '/logs/system', 'FileText', '系统日志', 1, '1734095616123456001', '1734095616123456001'),
('1734095616123456412', 'menu.logs.operations', 'menu', 'read', 'menu', '/logs/operations', 'Activity', '操作日志', 2, '1734095616123456001', '1734095616123456001'),
('1734095616123456413', 'menu.logs.requests', 'menu', 'read', 'menu', '/logs/requests', 'Globe', '请求日志', 3, '1734095616123456001', '1734095616123456001'),

-- 系统管理子菜单（更新现有的settings菜单结构）
('1734095616123456421', 'menu.system.users', 'menu', 'read', 'menu', '/system/users', 'Users', '用户管理', 1, '1734095616123456001', '1734095616123456001'),
('1734095616123456422', 'menu.system.roles', 'menu', 'read', 'menu', '/system/roles', 'UserCog', '角色管理', 2, '1734095616123456001', '1734095616123456001'),
('1734095616123456423', 'menu.system.permissions', 'menu', 'read', 'menu', '/system/permissions', 'Lock', '权限管理', 3, '1734095616123456001', '1734095616123456001')

ON CONFLICT (id) DO NOTHING;

-- 更新现有settings菜单为系统管理
UPDATE permissions SET 
  name = 'menu.system',
  description = '系统管理',
  menu_path = '/system',
  updated_by = '1734095616123456001'
WHERE name = 'menu.settings';

-- 更新父权限关系
-- 设置日志子菜单的父权限
UPDATE permissions SET parent_permission_id = '1734095616123456406'
WHERE id IN ('1734095616123456411', '1734095616123456412', '1734095616123456413');

-- 设置系统子菜单的父权限（使用现有的settings菜单ID）
UPDATE permissions SET parent_permission_id = (SELECT id FROM permissions WHERE name = 'menu.system' LIMIT 1)
WHERE id IN ('1734095616123456421', '1734095616123456422', '1734095616123456423');

-- 为管理员角色分配新的菜单权限
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  '173409561612345670' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') as id,
  '1734095616123456101' as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.id IN (
  '1734095616123456404', '1734095616123456405', '1734095616123456406',
  '1734095616123456411', '1734095616123456412', '1734095616123456413', 
  '1734095616123456421', '1734095616123456422', '1734095616123456423'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '1734095616123456101' 
  AND rp.permission_id = p.id
);

-- 为普通用户角色分配基础菜单权限（仪表板、项目、应用）
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  '173409561612345680' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') as id,
  '1734095616123456102' as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name IN ('menu.dashboard', 'menu.projects', 'menu.applications')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '1734095616123456102' 
  AND rp.permission_id = p.id
);

-- 更新现有的操作权限为中文描述
UPDATE permissions SET 
  description = '创建用户'
WHERE name = 'users.create';

UPDATE permissions SET 
  description = '编辑用户'
WHERE name = 'users.edit';

UPDATE permissions SET 
  description = '删除用户'
WHERE name = 'users.delete';

-- 添加新的操作权限
INSERT INTO permissions (id, name, permission_resource, permission_action, permission_type, menu_path, menu_icon, description, sort_order, created_by, updated_by) VALUES

-- 项目相关操作权限（更新tasks为projects）
('1734095616123456501', 'projects.create', 'projects', 'create', 'action', NULL, NULL, '创建项目', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456502', 'projects.edit', 'projects', 'update', 'action', NULL, NULL, '编辑项目', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456503', 'projects.delete', 'projects', 'delete', 'action', NULL, NULL, '删除项目', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456504', 'projects.view', 'projects', 'read', 'action', NULL, NULL, '查看项目', NULL, '1734095616123456001', '1734095616123456001'),

-- 应用相关操作权限
('1734095616123456511', 'applications.create', 'applications', 'create', 'action', NULL, NULL, '创建应用', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456512', 'applications.edit', 'applications', 'update', 'action', NULL, NULL, '编辑应用', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456513', 'applications.delete', 'applications', 'delete', 'action', NULL, NULL, '删除应用', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456514', 'applications.view', 'applications', 'read', 'action', NULL, NULL, '查看应用', NULL, '1734095616123456001', '1734095616123456001'),

-- 实例相关操作权限
('1734095616123456521', 'instances.create', 'instances', 'create', 'action', NULL, NULL, '创建实例', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456522', 'instances.edit', 'instances', 'update', 'action', NULL, NULL, '编辑实例', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456523', 'instances.delete', 'instances', 'delete', 'action', NULL, NULL, '删除实例', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456524', 'instances.view', 'instances', 'read', 'action', NULL, NULL, '查看实例', NULL, '1734095616123456001', '1734095616123456001'),

-- 部署相关操作权限
('1734095616123456531', 'deployments.create', 'deployments', 'create', 'action', NULL, NULL, '创建部署', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456532', 'deployments.edit', 'deployments', 'update', 'action', NULL, NULL, '编辑部署', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456533', 'deployments.delete', 'deployments', 'delete', 'action', NULL, NULL, '删除部署', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456534', 'deployments.view', 'deployments', 'read', 'action', NULL, NULL, '查看部署', NULL, '1734095616123456001', '1734095616123456001'),

-- 日志相关操作权限
('1734095616123456541', 'logs.view', 'logs', 'read', 'action', NULL, NULL, '查看日志', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456542', 'logs.export', 'logs', 'export', 'action', NULL, NULL, '导出日志', NULL, '1734095616123456001', '1734095616123456001'),

-- 系统管理相关操作权限
('1734095616123456551', 'system.users.manage', 'users', 'manage', 'action', NULL, NULL, '管理用户', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456552', 'system.roles.manage', 'roles', 'manage', 'action', NULL, NULL, '管理角色', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456553', 'system.permissions.manage', 'permissions', 'manage', 'action', NULL, NULL, '管理权限', NULL, '1734095616123456001', '1734095616123456001')

ON CONFLICT (id) DO NOTHING;

-- 更新现有的tasks权限为projects权限
UPDATE permissions SET 
  name = 'projects.create',
  permission_resource = 'projects',
  description = '创建项目'
WHERE name = 'tasks.create';

UPDATE permissions SET 
  name = 'projects.edit',
  permission_resource = 'projects', 
  description = '编辑项目'
WHERE name = 'tasks.edit';

UPDATE permissions SET 
  name = 'projects.delete',
  permission_resource = 'projects',
  description = '删除项目'
WHERE name = 'tasks.delete';

-- 为管理员角色分配所有新的操作权限
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  '173409561612345690' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') as id,
  '1734095616123456101' as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.id BETWEEN '1734095616123456501' AND '1734095616123456553'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '1734095616123456101' 
  AND rp.permission_id = p.id
);

-- 为普通用户角色分配基础查看权限
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  '173409561612345695' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') as id,
  '1734095616123456102' as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name IN ('projects.view', 'applications.view', 'deployments.view', 'logs.view')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '1734095616123456102' 
  AND rp.permission_id = p.id
);