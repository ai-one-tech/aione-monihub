-- 为文件表添加任务ID、实例ID、扩展名和原始文件路径字段
-- 时间: 2025-11-12
-- 作者: System
-- 说明: 此迁移脚本用于扩展现有的files表，增加与任务和实例关联的字段，以及文件元信息字段

-- 添加任务ID字段，用于关联文件与特定任务
-- 任务ID使用VARCHAR(36)类型，与系统中其他ID字段保持一致
ALTER TABLE files
    ADD COLUMN IF NOT EXISTS task_id VARCHAR (36);

-- 添加实例ID字段，用于关联文件与特定实例
-- 实例ID使用VARCHAR(36)类型，与系统中其他ID字段保持一致
ALTER TABLE files
    ADD COLUMN IF NOT EXISTS instance_id VARCHAR (36);

-- 添加文件扩展名字段，用于存储文件的扩展名信息
-- 文件扩展名使用VARCHAR(50)类型，足够容纳常见的文件扩展名
ALTER TABLE files
    ADD COLUMN IF NOT EXISTS file_extension VARCHAR (50);

-- 添加原始文件路径字段，用于存储文件上传前的原始路径
-- 原始文件路径使用VARCHAR(500)类型，与file_path字段保持一致
ALTER TABLE files
    ADD COLUMN IF NOT EXISTS original_file_path VARCHAR (500);

-- 为新增字段添加注释
COMMENT
ON COLUMN files.task_id IS '关联的任务ID，用于标识文件属于哪个任务';
COMMENT
ON COLUMN files.instance_id IS '关联的实例ID，用于标识文件属于哪个实例';
COMMENT
ON COLUMN files.file_extension IS '文件扩展名，用于标识文件类型';
COMMENT
ON COLUMN files.original_file_path IS '原始文件路径，记录文件上传前的完整路径';

-- 创建索引以提高查询性能
-- 为任务ID创建索引，提高按任务查询文件的效率
CREATE INDEX IF NOT EXISTS idx_files_task_id ON files(task_id);

-- 为实例ID创建索引，提高按实例查询文件的效率
CREATE INDEX IF NOT EXISTS idx_files_instance_id ON files(instance_id);