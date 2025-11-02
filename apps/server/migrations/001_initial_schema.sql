/*
 Navicat Premium Dump SQL

 Source Server         : basic.cloudfame.com
 Source Server Type    : PostgreSQL
 Source Server Version : 170006 (170006)
 Source Host           : basic.cloudfame.com:5432
 Source Catalog        : aione_monihub
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170006 (170006)
 File Encoding         : 65001

 Date: 02/11/2025 11:37:00
*/


-- ----------------------------
-- Table structure for applications
-- ----------------------------
CREATE TABLE "public"."applications" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "project_id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "auth_config" jsonb NOT NULL DEFAULT '{"users": [], "expiry_date": null}'::jsonb,
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."applications"."id" IS '应用唯一标识';
COMMENT ON COLUMN "public"."applications"."project_id" IS '所属项目ID';
COMMENT ON COLUMN "public"."applications"."name" IS '应用名称';
COMMENT ON COLUMN "public"."applications"."code" IS '应用代码，项目内唯一';
COMMENT ON COLUMN "public"."applications"."status" IS '应用状态：active(激活), disabled(禁用)';
COMMENT ON COLUMN "public"."applications"."description" IS '应用描述信息';
COMMENT ON COLUMN "public"."applications"."auth_config" IS '应用授权配置信息，包含用户列表和过期时间';
COMMENT ON COLUMN "public"."applications"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."applications"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."applications"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."applications"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."applications"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."applications"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "public"."applications" IS '应用表，存储项目下的应用信息';

-- ----------------------------
-- Records of applications
-- ----------------------------

-- ----------------------------
-- Table structure for configs
-- ----------------------------
CREATE TABLE "public"."configs" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "environment" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "config_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "version" int4 NOT NULL DEFAULT 1,
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."configs"."id" IS '配置唯一标识';
COMMENT ON COLUMN "public"."configs"."code" IS '配置代码标识';
COMMENT ON COLUMN "public"."configs"."environment" IS '环境标识：dev(开发), test(测试), prod(生产)';
COMMENT ON COLUMN "public"."configs"."name" IS '配置名称';
COMMENT ON COLUMN "public"."configs"."config_type" IS '配置类型：json, yaml, properties, text';
COMMENT ON COLUMN "public"."configs"."content" IS '配置内容';
COMMENT ON COLUMN "public"."configs"."description" IS '配置描述信息';
COMMENT ON COLUMN "public"."configs"."version" IS '配置版本号';
COMMENT ON COLUMN "public"."configs"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."configs"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."configs"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."configs"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."configs"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."configs"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "public"."configs" IS '配置表，存储各环境的配置信息';

-- ----------------------------
-- Records of configs
-- ----------------------------

-- ----------------------------
-- Table structure for deployments
-- ----------------------------
CREATE TABLE "public"."deployments" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "application_id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "environment" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "version" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "deployed_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deployed_at" timestamptz(3),
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."deployments"."id" IS '部署唯一标识';
COMMENT ON COLUMN "public"."deployments"."application_id" IS '应用ID';
COMMENT ON COLUMN "public"."deployments"."environment" IS '部署环境：dev(开发), test(测试), prod(生产)';
COMMENT ON COLUMN "public"."deployments"."version" IS '部署版本号';
COMMENT ON COLUMN "public"."deployments"."status" IS '部署状态：pending(待部署), deploying(部署中), success(成功), failed(失败), rollback(回滚)';
COMMENT ON COLUMN "public"."deployments"."config" IS '部署配置信息（JSON格式）';
COMMENT ON COLUMN "public"."deployments"."deployed_by" IS '部署人ID';
COMMENT ON COLUMN "public"."deployments"."deployed_at" IS '部署完成时间';
COMMENT ON COLUMN "public"."deployments"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."deployments"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."deployments"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."deployments"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."deployments"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."deployments"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "public"."deployments" IS '部署表，存储应用部署记录';

-- ----------------------------
-- Records of deployments
-- ----------------------------

-- ----------------------------
-- Table structure for instances
-- ----------------------------
CREATE TABLE "public"."instances" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "hostname" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "ip_address" inet NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "specifications" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "environment" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."instances"."id" IS '实例唯一标识';
COMMENT ON COLUMN "public"."instances"."name" IS '实例名称';
COMMENT ON COLUMN "public"."instances"."hostname" IS '实例主机名';
COMMENT ON COLUMN "public"."instances"."ip_address" IS '实例IP地址';
COMMENT ON COLUMN "public"."instances"."status" IS '实例状态：active(激活), disabled(禁用)';
COMMENT ON COLUMN "public"."instances"."specifications" IS '实例规格信息（JSON格式），包含CPU、内存、磁盘等信息';
COMMENT ON COLUMN "public"."instances"."environment" IS '实例环境：dev(开发), test(测试), prod(生产)';
COMMENT ON COLUMN "public"."instances"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."instances"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."instances"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."instances"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."instances"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."instances"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "public"."instances" IS '实例表，存储物理机或虚拟机信息';

-- ----------------------------
-- Records of instances
-- ----------------------------

-- ----------------------------
-- Table structure for logs
-- ----------------------------
CREATE TABLE "public"."logs" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "application_id" varchar(64) COLLATE "pg_catalog"."default",
  "log_level" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "message" text COLLATE "pg_catalog"."default" NOT NULL,
  "context" jsonb DEFAULT '{}'::jsonb,
  "log_source" varchar(255) COLLATE "pg_catalog"."default",
  "timestamp" timestamptz(3) NOT NULL DEFAULT now(),
  "created_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."logs"."id" IS '日志唯一标识';
COMMENT ON COLUMN "public"."logs"."application_id" IS '关联应用ID，可为空';
COMMENT ON COLUMN "public"."logs"."log_level" IS '日志级别：DEBUG, INFO, WARN, ERROR, FATAL';
COMMENT ON COLUMN "public"."logs"."message" IS '日志消息内容';
COMMENT ON COLUMN "public"."logs"."context" IS '日志上下文信息（JSON格式）';
COMMENT ON COLUMN "public"."logs"."log_source" IS '日志来源标识';
COMMENT ON COLUMN "public"."logs"."timestamp" IS '日志时间戳';
COMMENT ON COLUMN "public"."logs"."created_at" IS '记录创建时间';
COMMENT ON TABLE "public"."logs" IS '日志表，存储系统和应用日志';

-- ----------------------------
-- Records of logs
-- ----------------------------

-- ----------------------------
-- Table structure for password_reset_tokens
-- ----------------------------
CREATE TABLE "public"."password_reset_tokens" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "token" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "expires_at" timestamptz(3) NOT NULL,
  "used_at" timestamptz(3),
  "created_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."password_reset_tokens"."id" IS '令牌记录唯一标识';
COMMENT ON COLUMN "public"."password_reset_tokens"."user_id" IS '关联用户ID';
COMMENT ON COLUMN "public"."password_reset_tokens"."token" IS '重置令牌字符串，唯一标识一次重置请求';
COMMENT ON COLUMN "public"."password_reset_tokens"."expires_at" IS '令牌过期时间';
COMMENT ON COLUMN "public"."password_reset_tokens"."used_at" IS '令牌使用时间，NULL表示未使用';
COMMENT ON COLUMN "public"."password_reset_tokens"."created_at" IS '令牌创建时间';
COMMENT ON TABLE "public"."password_reset_tokens" IS '密码重置令牌表，存储用户密码重置请求的令牌信息';

-- ----------------------------
-- Records of password_reset_tokens
-- ----------------------------

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
CREATE TABLE "public"."permissions" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "permission_resource" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "permission_action" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "permission_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "menu_path" varchar(255) COLLATE "pg_catalog"."default",
  "menu_icon" varchar(100) COLLATE "pg_catalog"."default",
  "parent_permission_id" varchar(64) COLLATE "pg_catalog"."default",
  "sort_order" int4 DEFAULT 0,
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
  "is_hidden" bool NOT NULL DEFAULT false
)
;
COMMENT ON COLUMN "public"."permissions"."id" IS '权限唯一标识';
COMMENT ON COLUMN "public"."permissions"."name" IS '权限名称标识';
COMMENT ON COLUMN "public"."permissions"."permission_resource" IS '权限资源标识';
COMMENT ON COLUMN "public"."permissions"."permission_action" IS '权限操作：create(创建), read(读取), update(更新), delete(删除)';
COMMENT ON COLUMN "public"."permissions"."description" IS '权限描述信息';
COMMENT ON COLUMN "public"."permissions"."permission_type" IS '权限类型：menu(菜单), action(操作), button(按钮), page(页面)';
COMMENT ON COLUMN "public"."permissions"."menu_path" IS '菜单路径，仅菜单类型权限使用';
COMMENT ON COLUMN "public"."permissions"."menu_icon" IS '菜单图标，仅菜单类型权限使用';
COMMENT ON COLUMN "public"."permissions"."parent_permission_id" IS '父权限ID，用于构建菜单层级关系';
COMMENT ON COLUMN "public"."permissions"."sort_order" IS '排序顺序，用于菜单排序';
COMMENT ON COLUMN "public"."permissions"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."permissions"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."permissions"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."permissions"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."permissions"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."permissions"."updated_at" IS '记录更新时间';
COMMENT ON COLUMN "public"."permissions"."is_hidden" IS '是否隐藏菜单：true(隐藏), false(显示)，仅对菜单类型权限有效';
COMMENT ON TABLE "public"."permissions" IS '权限表，存储系统权限信息，支持菜单和操作权限';

-- ----------------------------
-- Records of permissions
-- ----------------------------
INSERT INTO "public"."permissions" VALUES ('1734095616123456316', 'menu.settings', 'menu', 'read', '系统设置菜单', 'menu', '/settings', 'Settings', NULL, 6, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:25:47.767+00', '2025-11-02 03:25:47.767+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456303', 'menu.applications', 'menu', 'read', '应用管理', 'menu', '/applications', 'Package', NULL, 3, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:24:02.909+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456406', 'menu.logs', 'menu', 'read', '日志管理', 'menu', '/logs', 'HelpCircle', NULL, 10, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:26:46.989+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456404', 'menu.instances', 'menu', 'read', '实例管理', 'menu', '/instances', 'HelpCircle', NULL, 8, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:26:45.636+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456405', 'menu.deployments', 'menu', 'read', '部署管理', 'menu', '/deployments', 'HelpCircle', NULL, 9, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:27:05.53+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456421', 'menu.system.users', 'menu', 'read', '用户管理', 'menu', '/system/users', '', '1734095616123456306', 1, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:27:32.634+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456422', 'menu.system.roles', 'menu', 'read', '角色管理', 'menu', '/system/roles', '', '1734095616123456306', 2, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:27:32.657+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456423', 'menu.system.permissions', 'menu', 'read', '权限管理', 'menu', '/system/permissions', '', '1734095616123456306', 3, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:27:32.687+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456301', 'menu.dashboard', 'menu', 'read', '仪表板', 'menu', '/', 'LayoutDashboard', NULL, 1, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456302', 'menu.projects', 'menu', 'read', '项目管理', 'menu', '/projects', 'ListTodo', NULL, 2, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456306', 'menu.system', 'menu', 'read', '系统管理', 'menu', '/system', 'Settings', NULL, 6, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456307', 'menu.help-center', 'menu', 'read', '帮助中心', 'menu', '/help-center', 'HelpCircle', NULL, 7, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456501', 'projects.create', 'projects', 'create', '创建项目', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456502', 'projects.edit', 'projects', 'update', '编辑项目', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456503', 'projects.delete', 'projects', 'delete', '删除项目', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456504', 'projects.view', 'projects', 'read', '查看项目', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456511', 'applications.create', 'applications', 'create', '创建应用', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456512', 'applications.edit', 'applications', 'update', '编辑应用', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456513', 'applications.delete', 'applications', 'delete', '删除应用', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456514', 'applications.view', 'applications', 'read', '查看应用', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456521', 'instances.create', 'instances', 'create', '创建实例', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456522', 'instances.edit', 'instances', 'update', '编辑实例', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456523', 'instances.delete', 'instances', 'delete', '删除实例', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456524', 'instances.view', 'instances', 'read', '查看实例', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456531', 'deployments.create', 'deployments', 'create', '创建部署', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456532', 'deployments.edit', 'deployments', 'update', '编辑部署', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456533', 'deployments.delete', 'deployments', 'delete', '删除部署', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456534', 'deployments.view', 'deployments', 'read', '查看部署', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456541', 'logs.view', 'logs', 'read', '查看日志', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456542', 'logs.export', 'logs', 'export', '导出日志', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456551', 'system.users.manage', 'users', 'manage', '管理用户', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456552', 'system.roles.manage', 'roles', 'manage', '管理角色', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456553', 'system.permissions.manage', 'permissions', 'manage', '管理权限', 'action', NULL, NULL, NULL, NULL, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:41.807+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456411', 'menu.logs.system', 'menu', 'read', '系统日志', 'menu', '/logs/system', 'FileText', '1734095616123456406', 1, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:48.045+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456412', 'menu.logs.operations', 'menu', 'read', '操作日志', 'menu', '/logs/operations', 'Activity', '1734095616123456406', 2, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:48.045+00', 'f');
INSERT INTO "public"."permissions" VALUES ('1734095616123456413', 'menu.logs.requests', 'menu', 'read', '请求日志', 'menu', '/logs/requests', 'Globe', '1734095616123456406', 3, '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:21:41.807+00', '2025-11-02 03:21:48.045+00', 'f');

-- ----------------------------
-- Table structure for projects
-- ----------------------------
CREATE TABLE "public"."projects" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."projects"."id" IS '项目唯一标识';
COMMENT ON COLUMN "public"."projects"."name" IS '项目名称';
COMMENT ON COLUMN "public"."projects"."code" IS '项目代码，用于标识';
COMMENT ON COLUMN "public"."projects"."status" IS '项目状态：active(激活), disabled(禁用)';
COMMENT ON COLUMN "public"."projects"."description" IS '项目描述信息';
COMMENT ON COLUMN "public"."projects"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."projects"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."projects"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."projects"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."projects"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."projects"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "public"."projects" IS '项目表，存储项目基本信息';

-- ----------------------------
-- Records of projects
-- ----------------------------
INSERT INTO "public"."projects" VALUES ('772663280763179008', 'p1', 'P1', 'active', 'ffffddd', '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:28:01.524+00', '2025-11-02 03:28:08.601+00');

-- ----------------------------
-- Table structure for role_permissions
-- ----------------------------
CREATE TABLE "public"."role_permissions" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "role_id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "permission_id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."role_permissions"."id" IS '角色权限关联唯一标识';
COMMENT ON COLUMN "public"."role_permissions"."role_id" IS '角色ID';
COMMENT ON COLUMN "public"."role_permissions"."permission_id" IS '权限ID';
COMMENT ON COLUMN "public"."role_permissions"."created_at" IS '记录创建时间';
COMMENT ON TABLE "public"."role_permissions" IS '角色权限关联表，存储角色与权限的多对多关系';

-- ----------------------------
-- Records of role_permissions
-- ----------------------------
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564001', '1734095616123456101', '1734095616123456301', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564002', '1734095616123456101', '1734095616123456302', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564003', '1734095616123456101', '1734095616123456303', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564004', '1734095616123456101', '1734095616123456304', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564005', '1734095616123456101', '1734095616123456305', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564006', '1734095616123456101', '1734095616123456306', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564007', '1734095616123456101', '1734095616123456307', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564008', '1734095616123456101', '1734095616123456321', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564009', '1734095616123456101', '1734095616123456322', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564010', '1734095616123456101', '1734095616123456323', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564011', '1734095616123456101', '1734095616123456331', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564012', '1734095616123456101', '1734095616123456332', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564013', '1734095616123456101', '1734095616123456333', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564014', '1734095616123456101', '1734095616123456311', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564015', '1734095616123456101', '1734095616123456312', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564016', '1734095616123456101', '1734095616123456313', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234564017', '1734095616123456101', '1734095616123456314', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234565001', '1734095616123456102', '1734095616123456301', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234565002', '1734095616123456102', '1734095616123456302', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234565003', '1734095616123456102', '1734095616123456306', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('17340956161234565004', '1734095616123456102', '1734095616123456307', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457001', '1734095616123456101', '1734095616123456404', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457002', '1734095616123456101', '1734095616123456405', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457003', '1734095616123456101', '1734095616123456406', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457004', '1734095616123456101', '1734095616123456501', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457005', '1734095616123456101', '1734095616123456502', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457006', '1734095616123456101', '1734095616123456503', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457007', '1734095616123456101', '1734095616123456504', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457008', '1734095616123456101', '1734095616123456511', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457009', '1734095616123456101', '1734095616123456512', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457010', '1734095616123456101', '1734095616123456513', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457011', '1734095616123456101', '1734095616123456411', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457012', '1734095616123456101', '1734095616123456412', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457013', '1734095616123456101', '1734095616123456413', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457014', '1734095616123456101', '1734095616123456514', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457015', '1734095616123456101', '1734095616123456521', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457016', '1734095616123456101', '1734095616123456522', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457017', '1734095616123456101', '1734095616123456523', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457018', '1734095616123456101', '1734095616123456524', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457019', '1734095616123456101', '1734095616123456531', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457020', '1734095616123456101', '1734095616123456532', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457021', '1734095616123456101', '1734095616123456533', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457022', '1734095616123456101', '1734095616123456534', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457023', '1734095616123456101', '1734095616123456541', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457024', '1734095616123456101', '1734095616123456542', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457025', '1734095616123456101', '1734095616123456551', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457026', '1734095616123456101', '1734095616123456552', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457027', '1734095616123456101', '1734095616123456553', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457028', '1734095616123456101', '1734095616123456421', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457029', '1734095616123456101', '1734095616123456422', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123457030', '1734095616123456101', '1734095616123456423', '2025-11-02 03:10:31.232+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123456901', '1734095616123456101', '1734095616123456601', '2025-11-02 03:10:31.297+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123456902', '1734095616123456101', '1734095616123456602', '2025-11-02 03:10:31.297+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123456903', '1734095616123456101', '1734095616123456603', '2025-11-02 03:10:31.297+00');
INSERT INTO "public"."role_permissions" VALUES ('1734095616123458001', '1734095616123456102', '1734095616123456303', '2025-11-02 03:21:48.1+00');

-- ----------------------------
-- Table structure for roles
-- ----------------------------
CREATE TABLE "public"."roles" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."roles"."id" IS '角色唯一标识';
COMMENT ON COLUMN "public"."roles"."name" IS '角色名称';
COMMENT ON COLUMN "public"."roles"."description" IS '角色描述信息';
COMMENT ON COLUMN "public"."roles"."permissions" IS '角色权限列表（JSON数组）';
COMMENT ON COLUMN "public"."roles"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."roles"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."roles"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."roles"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."roles"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."roles"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "public"."roles" IS '角色表，存储系统角色信息';

-- ----------------------------
-- Records of roles
-- ----------------------------
INSERT INTO "public"."roles" VALUES ('1734095616123456101', 'admin', '管理员角色', '[]', '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:10:31.003+00', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."roles" VALUES ('1734095616123456102', 'user', '普通用户角色', '[]', '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:10:31.003+00', '2025-11-02 03:10:31.003+00');

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
CREATE TABLE "public"."user_roles" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "role_id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "created_by" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."user_roles"."id" IS '用户角色关联唯一标识';
COMMENT ON COLUMN "public"."user_roles"."user_id" IS '用户ID';
COMMENT ON COLUMN "public"."user_roles"."role_id" IS '角色ID';
COMMENT ON COLUMN "public"."user_roles"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."user_roles"."created_at" IS '记录创建时间';
COMMENT ON TABLE "public"."user_roles" IS '用户角色关联表，存储用户与角色的多对多关系';

-- ----------------------------
-- Records of user_roles
-- ----------------------------
INSERT INTO "public"."user_roles" VALUES ('1734095616123456201', '1734095616123456001', '1734095616123456101', '1734095616123456001', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."user_roles" VALUES ('1734095616123456202', '1734095616123456002', '1734095616123456102', '1734095616123456001', '2025-11-02 03:10:31.003+00');

-- ----------------------------
-- Table structure for users
-- ----------------------------
CREATE TABLE "public"."users" (
  "id" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "username" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "password_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_by" varchar(64) COLLATE "pg_catalog"."default",
  "updated_by" varchar(64) COLLATE "pg_catalog"."default",
  "deleted_at" timestamptz(3),
  "revision" int4 NOT NULL DEFAULT 1,
  "created_at" timestamptz(3) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(3) NOT NULL DEFAULT now()
)
;
COMMENT ON COLUMN "public"."users"."id" IS '用户唯一标识';
COMMENT ON COLUMN "public"."users"."username" IS '用户名，用于登录';
COMMENT ON COLUMN "public"."users"."email" IS '用户邮箱地址';
COMMENT ON COLUMN "public"."users"."password_hash" IS '用户密码哈希值';
COMMENT ON COLUMN "public"."users"."status" IS '用户状态：active(激活), disabled(禁用)';
COMMENT ON COLUMN "public"."users"."created_by" IS '创建人ID';
COMMENT ON COLUMN "public"."users"."updated_by" IS '更新人ID';
COMMENT ON COLUMN "public"."users"."deleted_at" IS '软删除时间戳';
COMMENT ON COLUMN "public"."users"."revision" IS '数据版本号，用于乐观锁';
COMMENT ON COLUMN "public"."users"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "public"."users"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "public"."users" IS '用户表，存储系统用户基本信息';

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "public"."users" VALUES ('1734095616123456001', 'admin', 'admin@example.com', '$2b$12$p9WiTOmpZ3L/GndiIrKCgeGsRlKjRof5fZ0Vjf0moTU0hV8PJjCFS', 'active', '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:10:31.003+00', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."users" VALUES ('1734095616123456002', 'testuser', 'test@example.com', '$2b$12$zL.vTZsmzp5uQBVbwyzgXO3TCiF1YbB14zCminf4rN4V7dynZq5kG', 'active', '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:10:31.003+00', '2025-11-02 03:10:31.003+00');
INSERT INTO "public"."users" VALUES ('1734095616123456003', 'disabled_user', 'disabled@example.com', '$2b$12$zL.vTZsmzp5uQBVbwyzgXO3TCiF1YbB14zCminf4rN4V7dynZq5kG', 'disabled', '1734095616123456001', '1734095616123456001', NULL, 1, '2025-11-02 03:10:31.003+00', '2025-11-02 03:10:31.003+00');

-- ----------------------------
-- Indexes structure for table applications
-- ----------------------------
CREATE INDEX "idx_applications_code" ON "public"."applications" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_applications_created_at" ON "public"."applications" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_applications_project_id" ON "public"."applications" USING btree (
  "project_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_applications_status" ON "public"."applications" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table applications
-- ----------------------------
CREATE TRIGGER "update_applications_updated_at" BEFORE UPDATE ON "public"."applications"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Uniques structure for table applications
-- ----------------------------
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_project_id_code_key" UNIQUE ("project_id", "code");

-- ----------------------------
-- Primary Key structure for table applications
-- ----------------------------
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table configs
-- ----------------------------
CREATE INDEX "idx_configs_code" ON "public"."configs" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_configs_environment" ON "public"."configs" USING btree (
  "environment" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_configs_type" ON "public"."configs" USING btree (
  "config_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_configs_version" ON "public"."configs" USING btree (
  "version" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table configs
-- ----------------------------
CREATE TRIGGER "update_configs_updated_at" BEFORE UPDATE ON "public"."configs"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Uniques structure for table configs
-- ----------------------------
ALTER TABLE "public"."configs" ADD CONSTRAINT "configs_code_environment_version_key" UNIQUE ("code", "environment", "version");

-- ----------------------------
-- Primary Key structure for table configs
-- ----------------------------
ALTER TABLE "public"."configs" ADD CONSTRAINT "configs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table deployments
-- ----------------------------
CREATE INDEX "idx_deployments_application_id" ON "public"."deployments" USING btree (
  "application_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_deployments_deployed_at" ON "public"."deployments" USING btree (
  "deployed_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_deployments_environment" ON "public"."deployments" USING btree (
  "environment" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_deployments_status" ON "public"."deployments" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table deployments
-- ----------------------------
CREATE TRIGGER "update_deployments_updated_at" BEFORE UPDATE ON "public"."deployments"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Primary Key structure for table deployments
-- ----------------------------
ALTER TABLE "public"."deployments" ADD CONSTRAINT "deployments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table instances
-- ----------------------------
CREATE INDEX "idx_instances_environment" ON "public"."instances" USING btree (
  "environment" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_instances_hostname" ON "public"."instances" USING btree (
  "hostname" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_instances_ip_address" ON "public"."instances" USING btree (
  "ip_address" "pg_catalog"."inet_ops" ASC NULLS LAST
);
CREATE INDEX "idx_instances_status" ON "public"."instances" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table instances
-- ----------------------------
CREATE TRIGGER "update_instances_updated_at" BEFORE UPDATE ON "public"."instances"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Uniques structure for table instances
-- ----------------------------
ALTER TABLE "public"."instances" ADD CONSTRAINT "instances_hostname_key" UNIQUE ("hostname");

-- ----------------------------
-- Primary Key structure for table instances
-- ----------------------------
ALTER TABLE "public"."instances" ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table logs
-- ----------------------------
CREATE INDEX "idx_logs_application_id" ON "public"."logs" USING btree (
  "application_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_logs_created_at" ON "public"."logs" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_logs_level" ON "public"."logs" USING btree (
  "log_level" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_logs_timestamp" ON "public"."logs" USING btree (
  "timestamp" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table logs
-- ----------------------------
ALTER TABLE "public"."logs" ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table password_reset_tokens
-- ----------------------------
CREATE INDEX "idx_password_reset_tokens_expires_at" ON "public"."password_reset_tokens" USING btree (
  "expires_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_password_reset_tokens_token" ON "public"."password_reset_tokens" USING btree (
  "token" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_password_reset_tokens_user_id" ON "public"."password_reset_tokens" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table password_reset_tokens
-- ----------------------------
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token");

-- ----------------------------
-- Primary Key structure for table password_reset_tokens
-- ----------------------------
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table permissions
-- ----------------------------
CREATE INDEX "idx_permissions_is_hidden" ON "public"."permissions" USING btree (
  "is_hidden" "pg_catalog"."bool_ops" ASC NULLS LAST
);
CREATE INDEX "idx_permissions_menu_path" ON "public"."permissions" USING btree (
  "menu_path" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_permissions_parent_id" ON "public"."permissions" USING btree (
  "parent_permission_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_permissions_permission_type" ON "public"."permissions" USING btree (
  "permission_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_permissions_sort_order" ON "public"."permissions" USING btree (
  "sort_order" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table permissions
-- ----------------------------
CREATE TRIGGER "update_permissions_updated_at" BEFORE UPDATE ON "public"."permissions"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Uniques structure for table permissions
-- ----------------------------
ALTER TABLE "public"."permissions" ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");

-- ----------------------------
-- Primary Key structure for table permissions
-- ----------------------------
ALTER TABLE "public"."permissions" ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table projects
-- ----------------------------
CREATE INDEX "idx_projects_code" ON "public"."projects" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_projects_status" ON "public"."projects" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table projects
-- ----------------------------
CREATE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Uniques structure for table projects
-- ----------------------------
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_code_key" UNIQUE ("code");

-- ----------------------------
-- Primary Key structure for table projects
-- ----------------------------
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table role_permissions
-- ----------------------------
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");

-- ----------------------------
-- Primary Key structure for table role_permissions
-- ----------------------------
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Triggers structure for table roles
-- ----------------------------
CREATE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "public"."roles"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Uniques structure for table roles
-- ----------------------------
ALTER TABLE "public"."roles" ADD CONSTRAINT "roles_name_key" UNIQUE ("name");

-- ----------------------------
-- Primary Key structure for table roles
-- ----------------------------
ALTER TABLE "public"."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table user_roles
-- ----------------------------
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_role_id_key" UNIQUE ("user_id", "role_id");

-- ----------------------------
-- Primary Key structure for table user_roles
-- ----------------------------
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE INDEX "idx_users_created_at" ON "public"."users" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_email" ON "public"."users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_status" ON "public"."users" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_username" ON "public"."users" USING btree (
  "username" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table users
-- ----------------------------
CREATE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();

-- ----------------------------
-- Uniques structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
ALTER TABLE "public"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
