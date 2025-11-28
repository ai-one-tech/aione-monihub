// Snowflake ID 使用示例

// ===== 用户模块示例 =====
// 在创建用户时使用 Snowflake ID
use crate::shared::generate_snowflake_id;
use chrono::Utc;
use sea_orm::ActiveValue;

// 示例：用户创建函数
pub async fn create_user_example(
    username: String,
    email: String,
    password: String,
) -> Result<String, Box<dyn std::error::Error>> {
    // 生成 Snowflake ID
    let id = generate_snowflake_id()?;

    // 在 ActiveModel 中使用生成的 ID
    let user_data = users::ActiveModel {
        id: ActiveValue::Set(id),
        username: ActiveValue::Set(username),
        email: ActiveValue::Set(email),
        // ... 其他字段
    };

    Ok(id)
}

// ===== 其他模块类似使用方式 =====
// 角色、项目、应用、日志等模块都可以使用相同的模式
