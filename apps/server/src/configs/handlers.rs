use crate::entities::configs::{ActiveModel, Column, Entity as Configs};
use crate::shared::enums::{Environment, ConfigType};
use crate::shared::error::ApiError;
use crate::shared::generate_snowflake_id;
use actix_web::{web, HttpResponse, HttpRequest};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, QuerySelect, Set, Order, PaginatorTrait};
use serde_json::Value;
use crate::configs::value_sync::sync_config_values;
use crate::configs::models::{ConfigCreateRequest, ConfigUpdateRequest, ConfigListQuery, ConfigListResponse, ConfigResponse, Pagination};

#[utoipa::path(
    get,
    path = "/api/configs",
    params(ConfigListQuery),
    responses(
        (status = 200, description = "List configs successfully", body = ConfigListResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Configs"
)]
pub async fn get_configs(
    query: web::Query<ConfigListQuery>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    // 获取分页参数
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).max(1).min(100);
    let _offset = (page - 1) * limit;

    // 构建查询
    let mut query_builder = Configs::find();
    
    // 添加搜索条件
    if let Some(search) = &query.search {
        query_builder = query_builder.filter(
            Column::Code.contains(search)
                .or(Column::Name.contains(search))
                .or(Column::Description.contains(search)),
        );
    }
    
    // 添加环境过滤
    if let Some(environment) = &query.environment {
        query_builder = query_builder.filter(Column::Environment.eq(environment));
    }
    
    // 添加配置类型过滤
    if let Some(config_type) = &query.config_type {
        query_builder = query_builder.filter(Column::ConfigType.eq(config_type));
    }
    
    // 如果不需要所有版本，只获取最新版本
    if !query.all_versions.unwrap_or(false) {
        // 这里简化处理，实际应该按code和environment分组获取最新版本
        query_builder = query_builder.order_by(Column::Version, Order::Desc);
    }

    // 获取总数
    let _total = query_builder.clone().count(db.get_ref()).await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;
    
    // 获取数据
    let paginator = Configs::find()
        .filter(Column::DeletedAt.is_null())
        .paginate(db.get_ref(), limit as u64);

    let total = paginator.num_items().await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;
    let configs = paginator.fetch_page((page - 1) as u64).await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    // 转换为响应格式
    let config_responses: Vec<ConfigResponse> = configs
        .into_iter()
        .map(|config| ConfigResponse {
            id: config.id,
            code: config.code,
            environment: config.environment,
            name: config.name,
            config_type: config.config_type,
            content: config.content,
            description: config.description.unwrap_or_default(),
            version: config.version as u32,
            created_at: config.created_at.to_rfc3339(),
            updated_at: config.updated_at.to_rfc3339(),
            generate_values: config.generate_values,
            schema: config.schema.as_ref().map(|v| serde_json::to_string(v).unwrap_or_default()),
        })
        .collect();

    let response = ConfigListResponse {
        data: config_responses,
        pagination: Pagination {
            page,
            limit,
            total: total as u32,
        },
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    post,
    path = "/api/configs",
    request_body = ConfigCreateRequest,
    responses(
        (status = 200, description = "Config created successfully", body = ConfigResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Configs"
)]
pub async fn create_config(
    config: web::Json<ConfigCreateRequest>,
    db: web::Data<DatabaseConnection>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证请求数据
    if config.code.is_empty() {
        return Err(ApiError::ValidationError("Code is required".to_string()));
    }
    
    if config.environment.is_empty() {
        return Err(ApiError::ValidationError("Environment is required".to_string()));
    }
    
    if config.name.is_empty() {
        return Err(ApiError::ValidationError("Name is required".to_string()));
    }
    
    if config.config_type.is_empty() {
        return Err(ApiError::ValidationError("Config type is required".to_string()));
    }
    
    // 按类型校验内容
    let ct = config.config_type.to_lowercase();
    match ct.as_str() {
        "object" => {
            let v: Value = serde_json::from_str(&config.content)
                .map_err(|e| ApiError::ValidationError(format!("Invalid JSON object content: {}", e)))?;
            if !v.is_object() {
                return Err(ApiError::ValidationError("content 必须是 JSON 对象".to_string()));
            }
        }
        "array" => {
            let v: Value = serde_json::from_str(&config.content)
                .map_err(|e| ApiError::ValidationError(format!("Invalid JSON array content: {}", e)))?;
            if !v.is_array() {
                return Err(ApiError::ValidationError("content 必须是 JSON 数组".to_string()));
            }
            if config.generate_values.unwrap_or(false) {
                for item in v.as_array().unwrap() {
                    let obj = item.as_object().ok_or_else(|| ApiError::ValidationError("array 项必须是对象".to_string()))?;
                    if obj.get("code").and_then(|x| x.as_str()).is_none() {
                        return Err(ApiError::ValidationError("array 每项必须包含字符串字段 code".to_string()));
                    }
                    if obj.get("name").and_then(|x| x.as_str()).is_none() {
                        return Err(ApiError::ValidationError("array 每项必须包含字符串字段 name".to_string()));
                    }
                }
            }
        }
        "html" | "text" => { /* 无结构校验 */ }
        _ => {
            return Err(ApiError::ValidationError("Invalid config_type".to_string()));
        }
    }

    // 生成雪花ID
    let id = generate_snowflake_id();
    
    // 检查是否存在相同code、environment的配置，如果存在则版本号+1，否则为1
    let max_version_result = Configs::find()
        .filter(Column::Code.eq(&config.code))
        .filter(Column::Environment.eq(&config.environment))
        .select_only()
        .column(Column::Version)
        .order_by(Column::Version, Order::Desc)
        .one(db.get_ref())
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    let version = if let Some(model) = max_version_result {
        model.version + 1
    } else {
        1
    };

    // 创建ActiveModel
    let config_model = ActiveModel {
        id: Set(id.clone()),
        code: Set(config.code.clone()),
        environment: Set(match config.environment.to_lowercase().as_str() {
            "dev" | "development" => Environment::Dev,
            "test" => Environment::Test,
            "staging" => Environment::Staging,
            "prod" | "production" => Environment::Prod,
            _ => {
                return Err(ApiError::ValidationError("Invalid environment".to_string()));
            }
        }),
        name: Set(config.name.clone()),
        config_type: Set(match ct.as_str() {
            "object" => ConfigType::Object,
            "array" => ConfigType::Array,
            "html" => ConfigType::Html,
            "text" => ConfigType::Text,
            _ => { return Err(ApiError::ValidationError("Invalid config_type".to_string())); }
        }),
        content: Set(config.content.clone()),
        description: Set(Some(config.description.clone())),
        version: Set(version),
        created_by: Set("system".to_string()), // 实际应该从认证信息中获取
        updated_by: Set("system".to_string()), // 实际应该从认证信息中获取
        deleted_at: Set(None),
        revision: Set(1),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
        generate_values: Set(config.generate_values.unwrap_or(false)),
        schema: Set(match &config.schema {
            Some(s) if !s.is_empty() => {
                let v: Value = serde_json::from_str(s).map_err(|e| ApiError::ValidationError(format!("Invalid schema JSON: {}", e)))?;
                Some(v)
            }
            _ => None,
        }),

    };

    // 保存到数据库
    let saved_config = config_model
        .insert(db.get_ref())
        .await
        .map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    // 转换为响应格式
    let response = ConfigResponse {
        id: saved_config.id,
        code: saved_config.code,
        environment: saved_config.environment,
        name: saved_config.name,
        config_type: saved_config.config_type,
        content: saved_config.content,
        description: saved_config.description.unwrap_or_default(),
        version: saved_config.version as u32,
        created_at: saved_config.created_at.to_rfc3339(),
        updated_at: saved_config.updated_at.to_rfc3339(),
        generate_values: saved_config.generate_values,
        schema: saved_config.schema.as_ref().map(|v| serde_json::to_string(v).unwrap_or_default()),

    };

    // 审计记录：新增配置
    let after = serde_json::json!({
        "id": response.id,
        "code": response.code,
        "environment": response.environment,
        "name": response.name,
        "config_type": response.config_type,
        "version": response.version,
        "created_at": response.created_at,
        "updated_at": response.updated_at,
    });
    let _ = crate::shared::request_context::record_audit_log_simple(
        db.get_ref(),
        "configs",
        "create",
        &req,
        None,
        Some(after),
    ).await;

    // 若需要生成选项值，执行同步
    if ct == "array" && config.generate_values.unwrap_or(false) {
        let parsed: Value = serde_json::from_str(&config.content).map_err(|e| ApiError::ValidationError(format!("Invalid JSON array content: {}", e)))?;
        let items = parsed.as_array().unwrap().clone();
        sync_config_values(
            db.get_ref(),
            &response.id,
            &response.code,
            &match response.environment { Environment::Dev => "dev", Environment::Test => "test", Environment::Staging => "staging", Environment::Prod => "prod" },
            response.version as i32,
            &items,
        ).await?;
    }

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    put,
    path = "/api/configs/{id}",
    request_body = ConfigUpdateRequest,
    responses(
        (status = 200, description = "Config updated (new version) successfully", body = ConfigResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Configs"
)]
pub async fn update_config(
    id: web::Path<String>,
    config: web::Json<ConfigUpdateRequest>,
    db: web::Data<DatabaseConnection>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    if config.code.is_empty() || config.environment.is_empty() || config.name.is_empty() || config.config_type.is_empty() {
        return Err(ApiError::ValidationError("必填字段缺失".to_string()));
    }

    let ct = config.config_type.to_lowercase();
    match ct.as_str() {
        "object" => {
            let v: Value = serde_json::from_str(&config.content)
                .map_err(|e| ApiError::ValidationError(format!("Invalid JSON object content: {}", e)))?;
            if !v.is_object() { return Err(ApiError::ValidationError("content 必须是 JSON 对象".to_string())); }
        }
        "array" => {
            let v: Value = serde_json::from_str(&config.content)
                .map_err(|e| ApiError::ValidationError(format!("Invalid JSON array content: {}", e)))?;
            if !v.is_array() { return Err(ApiError::ValidationError("content 必须是 JSON 数组".to_string())); }
            if config.generate_values.unwrap_or(false) {
                for item in v.as_array().unwrap() {
                    let obj = item.as_object().ok_or_else(|| ApiError::ValidationError("array 项必须是对象".to_string()))?;
                    if obj.get("code").and_then(|x| x.as_str()).is_none() { return Err(ApiError::ValidationError("array 每项必须包含字符串字段 code".to_string())); }
                    if obj.get("name").and_then(|x| x.as_str()).is_none() { return Err(ApiError::ValidationError("array 每项必须包含字符串字段 name".to_string())); }
                }
            }
        }
        "html" | "text" => {}
        _ => { return Err(ApiError::ValidationError("Invalid config_type".to_string())); }
    }

    // 计算新版本号
    let max_version_result = Configs::find()
        .filter(Column::Code.eq(&config.code))
        .filter(Column::Environment.eq(&config.environment))
        .select_only()
        .column(Column::Version)
        .order_by(Column::Version, Order::Desc)
        .one(db.get_ref())
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let version = if let Some(model) = max_version_result { model.version + 1 } else { 1 };

    let id_new = generate_snowflake_id();
    let config_model = ActiveModel {
        id: Set(id_new.clone()),
        code: Set(config.code.clone()),
        environment: Set(match config.environment.to_lowercase().as_str() {
            "dev" | "development" => Environment::Dev,
            "test" => Environment::Test,
            "staging" => Environment::Staging,
            "prod" | "production" => Environment::Prod,
            _ => { return Err(ApiError::ValidationError("Invalid environment".to_string())); }
        }),
        name: Set(config.name.clone()),
        config_type: Set(match ct.as_str() {
            "object" => ConfigType::Object,
            "array" => ConfigType::Array,
            "html" => ConfigType::Html,
            "text" => ConfigType::Text,
            _ => { return Err(ApiError::ValidationError("Invalid config_type".to_string())); }
        }),
        content: Set(config.content.clone()),
        description: Set(Some(config.description.clone())),
        version: Set(version),
        created_by: Set("system".to_string()),
        updated_by: Set("system".to_string()),
        deleted_at: Set(None),
        revision: Set(1),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
        generate_values: Set(config.generate_values.unwrap_or(false)),
        schema: Set(match &config.schema {
            Some(s) if !s.is_empty() => {
                let v: Value = serde_json::from_str(s).map_err(|e| ApiError::ValidationError(format!("Invalid schema JSON: {}", e)))?;
                Some(v)
            }
            _ => None,
        }),
    };

    let saved_config = config_model
        .insert(db.get_ref())
        .await
        .map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    let response = ConfigResponse {
        id: saved_config.id.clone(),
        code: saved_config.code.clone(),
        environment: saved_config.environment,
        name: saved_config.name.clone(),
        config_type: saved_config.config_type,
        content: saved_config.content.clone(),
        description: saved_config.description.clone().unwrap_or_default(),
        version: saved_config.version as u32,
        created_at: saved_config.created_at.to_rfc3339(),
        updated_at: saved_config.updated_at.to_rfc3339(),
        generate_values: saved_config.generate_values,
        schema: saved_config.schema.as_ref().map(|v| serde_json::to_string(v).unwrap_or_default()),
    };

    // 审计记录：更新配置（新版本）
    let after = serde_json::json!({
        "id": response.id,
        "code": response.code,
        "environment": response.environment,
        "name": response.name,
        "config_type": response.config_type,
        "version": response.version,
        "created_at": response.created_at,
        "updated_at": response.updated_at,
    });
    let _ = crate::shared::request_context::record_audit_log_simple(
        db.get_ref(),
        "configs",
        "update",
        &req,
        None,
        Some(after),
    ).await;

    if ct == "array" && config.generate_values.unwrap_or(false) {
        let parsed: Value = serde_json::from_str(&config.content).map_err(|e| ApiError::ValidationError(format!("Invalid JSON array content: {}", e)))?;
        let items = parsed.as_array().unwrap().clone();
        sync_config_values(
            db.get_ref(),
            &response.id,
            &response.code,
            &match response.environment { Environment::Dev => "dev", Environment::Test => "test", Environment::Staging => "staging", Environment::Prod => "prod" },
            response.version as i32,
            &items,
        ).await?;
    }

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    get,
    path = "/api/configs/{code}",
    params(
        ("code" = String, Path, description = "Config code")
    ),
    responses(
        (status = 200, description = "Configs found successfully", body = ConfigListResponse),
        (status = 404, description = "Config not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Configs"
)]
pub async fn get_config_by_code(
    path: web::Path<String>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    let config_code = path.into_inner();

    // 查询所有具有相同code的配置
    let configs = Configs::find()
        .filter(Column::Code.eq(&config_code))
        .order_by(Column::CreatedAt, Order::Desc)
        .all(db.get_ref())
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    if configs.is_empty() {
        return Err(ApiError::NotFound("Config not found".to_string()));
    }

    // 转换为响应格式
    let config_responses: Vec<ConfigResponse> = configs
        .into_iter()
        .map(|config| ConfigResponse {
            id: config.id,
            code: config.code,
            environment: config.environment,
            name: config.name,
            config_type: config.config_type,
            content: config.content,
            description: config.description.unwrap_or_default(),
            version: config.version as u32,
            created_at: config.created_at.to_rfc3339(),
            updated_at: config.updated_at.to_rfc3339(),
            generate_values: config.generate_values,
            schema: config.schema.as_ref().map(|v| serde_json::to_string(v).unwrap_or_default()),
        })
        .collect();

    let config_count = config_responses.len() as u32;

    let response = ConfigListResponse {
        data: config_responses,
        pagination: Pagination {
            page: 1,
            limit: config_count,
            total: config_count,
        },
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    get,
    path = "/api/configs/{code}/{environment}",
    params(
        ("code" = String, Path, description = "Config code"),
        ("environment" = String, Path, description = "Environment name")
    ),
    responses(
        (status = 200, description = "Config found successfully", body = ConfigResponse),
        (status = 404, description = "Config not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Configs"
)]
pub async fn get_config_by_code_and_environment(
    path: web::Path<(String, String)>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    let (config_code, environment) = path.into_inner();

    // 查询具有相同code和environment的最新版本配置
    let config_result = Configs::find()
        .filter(Column::Code.eq(&config_code))
        .filter(Column::Environment.eq(&environment))
        .order_by(Column::Version, Order::Desc)
        .one(db.get_ref())
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let config = match config_result {
        Some(config) => config,
        None => return Err(ApiError::NotFound("Config not found".to_string())),
    };

    // 转换为响应格式
    let response = ConfigResponse {
        id: config.id,
        code: config.code,
        environment: config.environment,
        name: config.name,
        config_type: config.config_type,
        content: config.content,
        description: config.description.unwrap_or_default(),
        version: config.version as u32,
        created_at: config.created_at.to_rfc3339(),
        updated_at: config.updated_at.to_rfc3339(),
        generate_values: config.generate_values,
        schema: config.schema.as_ref().map(|v| serde_json::to_string(v).unwrap_or_default()),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    get,
    path = "/api/configs/{code}/{environment}/{version}",
    params(
        ("code" = String, Path, description = "Config code"),
        ("environment" = String, Path, description = "Environment name"),
        ("version" = u32, Path, description = "Config version")
    ),
    responses(
        (status = 200, description = "Config found successfully", body = ConfigResponse),
        (status = 404, description = "Config not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Configs"
)]
pub async fn get_config_by_code_env_and_version(
    path: web::Path<(String, String, u32)>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    let (config_code, environment, version) = path.into_inner();

    // 查询具有相同code、environment和version的配置
    let config_result = Configs::find()
        .filter(Column::Code.eq(&config_code))
        .filter(Column::Environment.eq(&environment))
        .filter(Column::Version.eq(version as i32))
        .one(db.get_ref())
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let config = match config_result {
        Some(config) => config,
        None => return Err(ApiError::NotFound("Config not found".to_string())),
    };

    // 转换为响应格式
    let response = ConfigResponse {
        id: config.id,
        code: config.code,
        environment: config.environment,
        name: config.name,
        config_type: config.config_type,
        content: config.content,
        description: config.description.unwrap_or_default(),
        version: config.version as u32,
        created_at: config.created_at.to_rfc3339(),
        updated_at: config.updated_at.to_rfc3339(),
        generate_values: config.generate_values,
        schema: config.schema.as_ref().map(|v| serde_json::to_string(v).unwrap_or_default()),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    delete,
    path = "/api/configs/{id}",
    params(
        ("id" = String, Path, description = "Config ID")
    ),
    responses(
        (status = 200, description = "Config deleted successfully"),
        (status = 404, description = "Config not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Configs"
)]
pub async fn delete_config(
    path: web::Path<String>,
    db: web::Data<DatabaseConnection>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let config_id = path.into_inner();

    // 查找配置记录
    let config_result = Configs::find_by_id(&config_id)
        .filter(Column::DeletedAt.is_null())
        .one(db.get_ref())
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    let config = match config_result {
        Some(config) => config,
        None => return Err(ApiError::NotFound("Config not found".to_string())),
    };

    // 实现软删除：更新deleted_at字段和revision字段
    let config_before = config.clone();
    let mut config_active_model: ActiveModel = config.into();
    config_active_model.deleted_at = Set(Some(Utc::now().into()));
    config_active_model.revision = Set(config_active_model.revision.unwrap() + 1);
    config_active_model.updated_at = Set(Utc::now().into());

    let _updated_config = config_active_model
        .update(db.get_ref())
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

    // 审计记录：删除配置
    let before = serde_json::json!({
        "id": config_before.id,
        "code": config_before.code,
        "environment": config_before.environment,
        "name": config_before.name,
        "config_type": config_before.config_type,
        "version": config_before.version,
        "created_at": config_before.created_at.to_rfc3339(),
        "updated_at": config_before.updated_at.to_rfc3339(),
    });
    let _ = crate::shared::request_context::record_audit_log_simple(
        db.get_ref(),
        "configs",
        "delete",
        &req,
        Some(before),
        None,
    ).await;

    Ok(HttpResponse::Ok().json("Config deleted successfully"))
}