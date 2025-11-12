-- 创建文件表以支持大文件上传和断点续传
-- 时间: 2025-11-12
-- 作者: System
-- 说明: 该表用于存储文件上传相关信息，支持大文件分块上传和断点续传功能

-- 创建文件信息表
CREATE TABLE IF NOT EXISTS files (
    -- 文件唯一标识符，使用UUID格式
    id VARCHAR(36) PRIMARY KEY,
    
    -- 文件名，最大长度255字符
    file_name VARCHAR(255) NOT NULL,
    
    -- 文件大小，以字节为单位
    file_size BIGINT NOT NULL,
    
    -- 文件存储路径，最大长度500字符
    file_path VARCHAR(500) NOT NULL,
    
    -- 上传用户ID，关联用户表
    uploaded_by VARCHAR(36) NOT NULL,
    
    -- 文件上传时间，默认为当前时间戳
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 文件更新时间，默认为当前时间戳
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 为表添加注释
COMMENT ON TABLE files IS '文件信息表，用于存储上传文件的元数据信息';

-- 为字段添加注释
COMMENT ON COLUMN files.id IS '文件唯一标识符，使用UUID格式';
COMMENT ON COLUMN files.file_name IS '文件名，最大长度255字符';
COMMENT ON COLUMN files.file_size IS '文件大小，以字节为单位';
COMMENT ON COLUMN files.file_path IS '文件存储路径，最大长度500字符';
COMMENT ON COLUMN files.uploaded_by IS '上传用户ID，关联用户表';
COMMENT ON COLUMN files.uploaded_at IS '文件上传时间，默认为当前时间戳';
COMMENT ON COLUMN files.updated_at IS '文件更新时间，默认为当前时间戳';

-- 创建索引以提高查询性能
-- 为上传用户ID创建索引，提高按用户查询文件的效率
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

-- 为上传时间创建索引，提高按时间查询文件的效率
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at);