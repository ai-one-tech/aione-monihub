use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde_json::Value;

use crate::entities::{config_values, ConfigValues};
use crate::shared::error::ApiError;
use crate::shared::generate_snowflake_id;

pub async fn sync_config_values(
    db: &DatabaseConnection,
    config_id: &str,
    config_code: &str,
    environment: &str,
    version: i32,
    items: &[Value],
) -> Result<(), ApiError> {
    // collect incoming codes
    let mut incoming_codes = std::collections::HashSet::new();

    for item in items {
        let obj = item
            .as_object()
            .ok_or_else(|| ApiError::ValidationError("array 项必须是对象".to_string()))?;
        let code = obj.get("code").and_then(|v| v.as_str()).ok_or_else(|| {
            ApiError::ValidationError("每个项必须包含字符串字段 code".to_string())
        })?;
        let name = obj.get("name").and_then(|v| v.as_str()).ok_or_else(|| {
            ApiError::ValidationError("每个项必须包含字符串字段 name".to_string())
        })?;
        incoming_codes.insert(code.to_string());

        // 查找当前有效记录
        let existing = ConfigValues::find()
            .filter(config_values::Column::ConfigCode.eq(config_code))
            .filter(config_values::Column::Environment.eq(environment))
            .filter(config_values::Column::Version.eq(version))
            .filter(config_values::Column::ValueCode.eq(code))
            .filter(config_values::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        if let Some(model) = existing {
            // 更新现有记录，revision +1
            let mut am: config_values::ActiveModel = model.into();
            am.value_name = Set(name.to_string());
            am.value_data = Set(Some(Value::Object(obj.clone())));
            am.revision = Set(am.revision.unwrap() + 1);
            am.updated_at = Set(Utc::now().into());
            am.update(db)
                .await
                .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
        } else {
            // 尝试恢复软删记录
            let soft_deleted = ConfigValues::find()
                .filter(config_values::Column::ConfigCode.eq(config_code))
                .filter(config_values::Column::Environment.eq(environment))
                .filter(config_values::Column::Version.eq(version))
                .filter(config_values::Column::ValueCode.eq(code))
                .filter(config_values::Column::DeletedAt.is_not_null())
                .one(db)
                .await
                .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

            if let Some(model) = soft_deleted {
                let mut am: config_values::ActiveModel = model.into();
                am.value_name = Set(name.to_string());
                am.value_data = Set(Some(Value::Object(obj.clone())));
                am.deleted_at = Set(None);
                am.revision = Set(am.revision.unwrap() + 1);
                am.updated_at = Set(Utc::now().into());
                am.update(db)
                    .await
                    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
            } else {
                // 新增
                let am = config_values::ActiveModel {
                    id: Set(generate_snowflake_id()),
                    config_id: Set(config_id.to_string()),
                    config_code: Set(config_code.to_string()),
                    environment: Set(environment.to_string()),
                    version: Set(version),
                    value_code: Set(code.to_string()),
                    value_name: Set(name.to_string()),
                    value_data: Set(Some(Value::Object(obj.clone()))),
                    revision: Set(1),
                    deleted_at: Set(None),
                    created_at: Set(Utc::now().into()),
                    updated_at: Set(Utc::now().into()),
                };
                am.insert(db)
                    .await
                    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
            }
        }
    }

    // 软删除缺失的项
    let existing_active = ConfigValues::find()
        .filter(config_values::Column::ConfigCode.eq(config_code))
        .filter(config_values::Column::Environment.eq(environment))
        .filter(config_values::Column::Version.eq(version))
        .filter(config_values::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    for model in existing_active {
        if !incoming_codes.contains(&model.value_code) {
            let mut am: config_values::ActiveModel = model.into();
            am.deleted_at = Set(Some(Utc::now().into()));
            am.updated_at = Set(Utc::now().into());
            am.update(db)
                .await
                .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
        }
    }

    Ok(())
}
