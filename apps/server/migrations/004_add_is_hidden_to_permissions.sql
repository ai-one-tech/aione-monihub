-- 为权限表添加菜单隐藏字段
-- 此迁移文件用于为permissions表添加is_hidden字段，支持菜单隐藏功能

-- 添加is_hidden字段到permissions表
ALTER TABLE permissions 
ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;

-- 添加字段注释
COMMENT ON COLUMN permissions.is_hidden IS '是否隐藏菜单：true(隐藏), false(显示)，仅对菜单类型权限有效';

-- 创建索引以提高查询性能
CREATE INDEX idx_permissions_is_hidden ON permissions(is_hidden);

-- 更新现有菜单权限的隐藏状态（可选：根据业务需求设置某些菜单为隐藏）
-- 示例：将某些系统管理菜单设置为隐藏
-- UPDATE permissions SET is_hidden = true 
-- WHERE permission_type = 'menu' AND name LIKE 'menu.system.%';