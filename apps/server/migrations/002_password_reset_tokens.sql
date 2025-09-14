-- 密码重置令牌表迁移脚本
-- 用于存储用户密码重置请求的令牌信息

-- 创建密码重置令牌表
CREATE TABLE password_reset_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ(3) NOT NULL,
    used_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

-- 添加表注释
COMMENT ON TABLE password_reset_tokens IS '密码重置令牌表，存储用户密码重置请求的令牌信息';

-- 添加字段注释
COMMENT ON COLUMN password_reset_tokens.id IS '令牌记录唯一标识';
COMMENT ON COLUMN password_reset_tokens.user_id IS '关联用户ID';
COMMENT ON COLUMN password_reset_tokens.token IS '重置令牌字符串，唯一标识一次重置请求';
COMMENT ON COLUMN password_reset_tokens.expires_at IS '令牌过期时间';
COMMENT ON COLUMN password_reset_tokens.used_at IS '令牌使用时间，NULL表示未使用';
COMMENT ON COLUMN password_reset_tokens.created_at IS '令牌创建时间';

-- 创建索引以提高查询性能
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- 创建用于清理过期令牌的函数（可选）
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION cleanup_expired_reset_tokens() IS '清理过期或已使用的密码重置令牌';