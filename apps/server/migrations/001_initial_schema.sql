-- PostgreSQL 数据库初始化脚本 - 合并版本
-- AiOne MoniHub 项目完整表结构
-- 使用雪花ID作为主键，去除外键约束

-- 用户表
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 项目表
CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 应用表
CREATE TABLE applications (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    auth_config JSONB NOT NULL DEFAULT '{"users": [], "expiry_date": null}',
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, code)
);

-- 配置表
CREATE TABLE configs (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    UNIQUE(code, environment, version)
);

-- 角色表
CREATE TABLE roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 用户角色关联表
CREATE TABLE user_roles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    role_id VARCHAR(64) NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- 权限表
CREATE TABLE permissions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    permission_resource VARCHAR(255) NOT NULL,
    permission_action VARCHAR(100) NOT NULL,
    description TEXT,
    permission_type VARCHAR(50) NOT NULL,
    menu_path VARCHAR(255),
    menu_icon VARCHAR(100),
    parent_permission_id VARCHAR(64),
    sort_order INTEGER DEFAULT 0,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(64) NOT NULL,
    permission_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 部署表
CREATE TABLE deployments (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    version VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    deployed_by VARCHAR(64) NOT NULL,
    deployed_at TIMESTAMPTZ(3),
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 机器表
CREATE TABLE machines (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hostname VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET NOT NULL,
    status VARCHAR(50) NOT NULL,
    specifications JSONB NOT NULL DEFAULT '{}',
    environment VARCHAR(50) NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ(3),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 日志表
CREATE TABLE logs (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64),
    log_level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    log_source VARCHAR(255),
    timestamp TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE users IS '用户表，存储系统用户基本信息';
COMMENT ON TABLE projects IS '项目表，存储项目基本信息';
COMMENT ON TABLE applications IS '应用表，存储项目下的应用信息';
COMMENT ON TABLE configs IS '配置表，存储各环境的配置信息';
COMMENT ON TABLE roles IS '角色表，存储系统角色信息';
COMMENT ON TABLE user_roles IS '用户角色关联表，存储用户与角色的多对多关系';
COMMENT ON TABLE permissions IS '权限表，存储系统权限信息，支持菜单和操作权限';
COMMENT ON TABLE role_permissions IS '角色权限关联表，存储角色与权限的多对多关系';
COMMENT ON TABLE deployments IS '部署表，存储应用部署记录';
COMMENT ON TABLE machines IS '机器表，存储物理机或虚拟机信息';
COMMENT ON TABLE logs IS '日志表，存储系统和应用日志';

-- 字段注释
-- 用户表字段注释
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.username IS '用户名，用于登录';
COMMENT ON COLUMN users.email IS '用户邮箱地址';
COMMENT ON COLUMN users.password_hash IS '用户密码哈希值';
COMMENT ON COLUMN users.status IS '用户状态：active(活跃), inactive(非活跃), disabled(禁用)';
COMMENT ON COLUMN users.created_by IS '创建人ID';
COMMENT ON COLUMN users.updated_by IS '更新人ID';
COMMENT ON COLUMN users.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN users.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN users.created_at IS '记录创建时间';
COMMENT ON COLUMN users.updated_at IS '记录更新时间';

-- 项目表字段注释
COMMENT ON COLUMN projects.id IS '项目唯一标识';
COMMENT ON COLUMN projects.name IS '项目名称';
COMMENT ON COLUMN projects.code IS '项目代码，用于标识';
COMMENT ON COLUMN projects.status IS '项目状态：active(活跃), inactive(非活跃), archived(已归档)';
COMMENT ON COLUMN projects.description IS '项目描述信息';
COMMENT ON COLUMN projects.created_by IS '创建人ID';
COMMENT ON COLUMN projects.updated_by IS '更新人ID';
COMMENT ON COLUMN projects.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN projects.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN projects.created_at IS '记录创建时间';
COMMENT ON COLUMN projects.updated_at IS '记录更新时间';

-- 应用表字段注释
COMMENT ON COLUMN applications.id IS '应用唯一标识';
COMMENT ON COLUMN applications.project_id IS '所属项目ID';
COMMENT ON COLUMN applications.name IS '应用名称';
COMMENT ON COLUMN applications.code IS '应用代码，项目内唯一';
COMMENT ON COLUMN applications.status IS '应用状态：active(活跃), inactive(非活跃), maintenance(维护中)';
COMMENT ON COLUMN applications.description IS '应用描述信息';
COMMENT ON COLUMN applications.auth_config IS '应用授权配置信息，包含用户列表和过期时间';
COMMENT ON COLUMN applications.created_by IS '创建人ID';
COMMENT ON COLUMN applications.updated_by IS '更新人ID';
COMMENT ON COLUMN applications.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN applications.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN applications.created_at IS '记录创建时间';
COMMENT ON COLUMN applications.updated_at IS '记录更新时间';

-- 配置表字段注释
COMMENT ON COLUMN configs.id IS '配置唯一标识';
COMMENT ON COLUMN configs.code IS '配置代码标识';
COMMENT ON COLUMN configs.environment IS '环境标识：dev(开发), test(测试), prod(生产)';
COMMENT ON COLUMN configs.name IS '配置名称';
COMMENT ON COLUMN configs.config_type IS '配置类型：json, yaml, properties, text';
COMMENT ON COLUMN configs.content IS '配置内容';
COMMENT ON COLUMN configs.description IS '配置描述信息';
COMMENT ON COLUMN configs.version IS '配置版本号';
COMMENT ON COLUMN configs.created_by IS '创建人ID';
COMMENT ON COLUMN configs.updated_by IS '更新人ID';
COMMENT ON COLUMN configs.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN configs.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN configs.created_at IS '记录创建时间';
COMMENT ON COLUMN configs.updated_at IS '记录更新时间';

-- 角色表字段注释
COMMENT ON COLUMN roles.id IS '角色唯一标识';
COMMENT ON COLUMN roles.name IS '角色名称';
COMMENT ON COLUMN roles.description IS '角色描述信息';
COMMENT ON COLUMN roles.permissions IS '角色权限列表（JSON数组）';
COMMENT ON COLUMN roles.created_by IS '创建人ID';
COMMENT ON COLUMN roles.updated_by IS '更新人ID';
COMMENT ON COLUMN roles.deleted_at IS '软删除时间戳';  
COMMENT ON COLUMN roles.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN roles.created_at IS '记录创建时间';
COMMENT ON COLUMN roles.updated_at IS '记录更新时间';

-- 用户角色关联表字段注释
COMMENT ON COLUMN user_roles.id IS '用户角色关联唯一标识';
COMMENT ON COLUMN user_roles.user_id IS '用户ID';
COMMENT ON COLUMN user_roles.role_id IS '角色ID';
COMMENT ON COLUMN user_roles.created_by IS '创建人ID';
COMMENT ON COLUMN user_roles.created_at IS '记录创建时间';

-- 权限表字段注释
COMMENT ON COLUMN permissions.id IS '权限唯一标识';
COMMENT ON COLUMN permissions.name IS '权限名称标识';
COMMENT ON COLUMN permissions.permission_resource IS '权限资源标识';
COMMENT ON COLUMN permissions.permission_action IS '权限操作：create(创建), read(读取), update(更新), delete(删除)';
COMMENT ON COLUMN permissions.description IS '权限描述信息';
COMMENT ON COLUMN permissions.permission_type IS '权限类型：menu(菜单), action(操作), button(按钮), page(页面)';
COMMENT ON COLUMN permissions.menu_path IS '菜单路径，仅菜单类型权限使用';
COMMENT ON COLUMN permissions.menu_icon IS '菜单图标，仅菜单类型权限使用';
COMMENT ON COLUMN permissions.parent_permission_id IS '父权限ID，用于构建菜单层级关系';
COMMENT ON COLUMN permissions.sort_order IS '排序顺序，用于菜单排序';
COMMENT ON COLUMN permissions.created_by IS '创建人ID';
COMMENT ON COLUMN permissions.updated_by IS '更新人ID';
COMMENT ON COLUMN permissions.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN permissions.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN permissions.created_at IS '记录创建时间';
COMMENT ON COLUMN permissions.updated_at IS '记录更新时间';

-- 角色权限关联表字段注释
COMMENT ON COLUMN role_permissions.id IS '角色权限关联唯一标识';
COMMENT ON COLUMN role_permissions.role_id IS '角色ID';
COMMENT ON COLUMN role_permissions.permission_id IS '权限ID';
COMMENT ON COLUMN role_permissions.created_at IS '记录创建时间';

-- 部署表字段注释
COMMENT ON COLUMN deployments.id IS '部署唯一标识';
COMMENT ON COLUMN deployments.application_id IS '应用ID';
COMMENT ON COLUMN deployments.environment IS '部署环境：dev(开发), test(测试), prod(生产)';
COMMENT ON COLUMN deployments.version IS '部署版本号';
COMMENT ON COLUMN deployments.status IS '部署状态：pending(待部署), deploying(部署中), success(成功), failed(失败), rollback(回滚)';
COMMENT ON COLUMN deployments.config IS '部署配置信息（JSON格式）';
COMMENT ON COLUMN deployments.deployed_by IS '部署人ID';
COMMENT ON COLUMN deployments.deployed_at IS '部署完成时间';
COMMENT ON COLUMN deployments.created_by IS '创建人ID';
COMMENT ON COLUMN deployments.updated_by IS '更新人ID';
COMMENT ON COLUMN deployments.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN deployments.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN deployments.created_at IS '记录创建时间';
COMMENT ON COLUMN deployments.updated_at IS '记录更新时间';

-- 机器表字段注释
COMMENT ON COLUMN machines.id IS '机器唯一标识';
COMMENT ON COLUMN machines.name IS '机器名称';
COMMENT ON COLUMN machines.hostname IS '机器主机名';
COMMENT ON COLUMN machines.ip_address IS '机器IP地址';
COMMENT ON COLUMN machines.status IS '机器状态：active(活跃), inactive(非活跃), maintenance(维护中)';
COMMENT ON COLUMN machines.specifications IS '机器规格信息（JSON格式），包含CPU、内存、磁盘等信息';
COMMENT ON COLUMN machines.environment IS '机器环境：dev(开发), test(测试), prod(生产)';
COMMENT ON COLUMN machines.created_by IS '创建人ID';
COMMENT ON COLUMN machines.updated_by IS '更新人ID';
COMMENT ON COLUMN machines.deleted_at IS '软删除时间戳';
COMMENT ON COLUMN machines.revision IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN machines.created_at IS '记录创建时间';
COMMENT ON COLUMN machines.updated_at IS '记录更新时间';

-- 日志表字段注释
COMMENT ON COLUMN logs.id IS '日志唯一标识';
COMMENT ON COLUMN logs.application_id IS '关联应用ID，可为空';
COMMENT ON COLUMN logs.log_level IS '日志级别：DEBUG, INFO, WARN, ERROR, FATAL';
COMMENT ON COLUMN logs.message IS '日志消息内容';
COMMENT ON COLUMN logs.context IS '日志上下文信息（JSON格式）';
COMMENT ON COLUMN logs.log_source IS '日志来源标识';
COMMENT ON COLUMN logs.timestamp IS '日志时间戳';
COMMENT ON COLUMN logs.created_at IS '记录创建时间';-- 创建索引以提高查询性能
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_code ON applications(code);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);

CREATE INDEX idx_configs_code ON configs(code);
CREATE INDEX idx_configs_environment ON configs(environment);
CREATE INDEX idx_configs_type ON configs(config_type);
CREATE INDEX idx_configs_version ON configs(version);

CREATE INDEX idx_deployments_application_id ON deployments(application_id);
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_deployed_at ON deployments(deployed_at);

CREATE INDEX idx_machines_hostname ON machines(hostname);
CREATE INDEX idx_machines_ip_address ON machines(ip_address);
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_machines_environment ON machines(environment);

CREATE INDEX idx_logs_application_id ON logs(application_id);
CREATE INDEX idx_logs_level ON logs(log_level);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_created_at ON logs(created_at);

CREATE INDEX idx_permissions_permission_type ON permissions(permission_type);
CREATE INDEX idx_permissions_parent_id ON permissions(parent_permission_id);
CREATE INDEX idx_permissions_sort_order ON permissions(sort_order);
CREATE INDEX idx_permissions_menu_path ON permissions(menu_path);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表创建更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configs_updated_at BEFORE UPDATE ON configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();-- 插入测试数据
-- 用于测试认证功能
-- 密码说明：
-- admin 用户：用户名=admin，密码=admin
-- testuser 用户：用户名=testuser，密码=password  
-- inactive_user 用户：用户名=inactive_user，密码=password（但状态为inactive）

-- 插入测试用户（使用示例雪花ID）
INSERT INTO users (id, username, email, password_hash, status, created_by, updated_by, revision, created_at, updated_at) 
VALUES 
    ('1734095616123456001', 'admin', 'admin@example.com', '$2b$12$p9WiTOmpZ3L/GndiIrKCgeGsRlKjRof5fZ0Vjf0moTU0hV8PJjCFS', 'active', NULL, NULL, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 更新管理员用户的created_by和updated_by为自身
UPDATE users 
SET created_by = '1734095616123456001',
    updated_by = '1734095616123456001'
WHERE id = '1734095616123456001';

-- 插入其他测试用户
INSERT INTO users (id, username, email, password_hash, status, created_by, updated_by, revision, created_at, updated_at) 
VALUES 
    ('1734095616123456002', 'testuser', 'test@example.com', '$2b$12$zL.vTZsmzp5uQBVbwyzgXO3TCiF1YbB14zCminf4rN4V7dynZq5kG', 'active', '1734095616123456001', '1734095616123456001', 1, NOW(), NOW()),
    ('1734095616123456003', 'inactive_user', 'inactive@example.com', '$2b$12$zL.vTZsmzp5uQBVbwyzgXO3TCiF1YbB14zCminf4rN4V7dynZq5kG', 'inactive', '1734095616123456001', '1734095616123456001', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入测试角色
INSERT INTO roles (id, name, description, created_by, updated_by, revision, created_at, updated_at)
VALUES 
    ('1734095616123456101', 'admin', '管理员角色', '1734095616123456001', '1734095616123456001', 1, NOW(), NOW()),
    ('1734095616123456102', 'user', '普通用户角色', '1734095616123456001', '1734095616123456001', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 分配用户角色
INSERT INTO user_roles (id, user_id, role_id, created_by, created_at)
VALUES 
    ('1734095616123456201', '1734095616123456001', '1734095616123456101', '1734095616123456001', NOW()),
    ('1734095616123456202', '1734095616123456002', '1734095616123456102', '1734095616123456001', NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 插入基础菜单权限数据
INSERT INTO permissions (id, name, permission_resource, permission_action, permission_type, menu_path, menu_icon, description, sort_order, created_by, updated_by) VALUES
-- 主菜单权限
('1734095616123456301', 'menu.dashboard', 'menu', 'read', 'menu', '/', 'LayoutDashboard', '仪表板菜单', 1, '1734095616123456001', '1734095616123456001'),
('1734095616123456302', 'menu.tasks', 'menu', 'read', 'menu', '/tasks', 'ListTodo', '任务管理菜单', 2, '1734095616123456001', '1734095616123456001'),
('1734095616123456303', 'menu.apps', 'menu', 'read', 'menu', '/apps', 'Package', '应用管理菜单', 3, '1734095616123456001', '1734095616123456001'),
('1734095616123456304', 'menu.chats', 'menu', 'read', 'menu', '/chats', 'MessagesSquare', '聊天管理菜单', 4, '1734095616123456001', '1734095616123456001'),
('1734095616123456305', 'menu.users', 'menu', 'read', 'menu', '/users', 'Users', '用户管理菜单', 5, '1734095616123456001', '1734095616123456001'),
('1734095616123456306', 'menu.settings', 'menu', 'read', 'menu', '/settings', 'Settings', '系统设置菜单', 6, '1734095616123456001', '1734095616123456001'),
('1734095616123456307', 'menu.help-center', 'menu', 'read', 'menu', '/help-center', 'HelpCircle', '帮助中心菜单', 7, '1734095616123456001', '1734095616123456001'),

-- 设置子菜单权限
('1734095616123456311', 'menu.settings.account', 'menu', 'read', 'menu', '/settings/account', 'Wrench', '账户设置', 1, '1734095616123456001', '1734095616123456001'),
('1734095616123456312', 'menu.settings.appearance', 'menu', 'read', 'menu', '/settings/appearance', 'Palette', '外观设置', 2, '1734095616123456001', '1734095616123456001'),
('1734095616123456313', 'menu.settings.notifications', 'menu', 'read', 'menu', '/settings/notifications', 'Bell', '通知设置', 3, '1734095616123456001', '1734095616123456001'),
('1734095616123456314', 'menu.settings.display', 'menu', 'read', 'menu', '/settings/display', 'Monitor', '显示设置', 4, '1734095616123456001', '1734095616123456001'),

-- 页面操作权限
('1734095616123456321', 'users.create', 'users', 'create', 'action', NULL, NULL, '创建用户', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456322', 'users.edit', 'users', 'update', 'action', NULL, NULL, '编辑用户', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456323', 'users.delete', 'users', 'delete', 'action', NULL, NULL, '删除用户', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456331', 'tasks.create', 'tasks', 'create', 'action', NULL, NULL, '创建任务', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456332', 'tasks.edit', 'tasks', 'update', 'action', NULL, NULL, '编辑任务', NULL, '1734095616123456001', '1734095616123456001'),
('1734095616123456333', 'tasks.delete', 'tasks', 'delete', 'action', NULL, NULL, '删除任务', NULL, '1734095616123456001', '1734095616123456001')
ON CONFLICT (id) DO NOTHING;

-- 更新父权限关系
UPDATE permissions SET parent_permission_id = '1734095616123456306'
WHERE id IN ('1734095616123456311', '1734095616123456312', '1734095616123456313', '1734095616123456314');

-- 为管理员角色分配所有权限
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  '173409561612345640' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') as id,
  '1734095616123456101' as role_id,
  p.id as permission_id
FROM permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '1734095616123456101' 
  AND rp.permission_id = p.id
);

-- 为普通用户角色分配基础菜单权限
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  '173409561612345650' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') as id,
  '1734095616123456102' as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name IN ('menu.dashboard', 'menu.tasks', 'menu.settings', 'menu.help-center')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '1734095616123456102' 
  AND rp.permission_id = p.id
);