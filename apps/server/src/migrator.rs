use sea_orm_migration::prelude::{
    async_trait, ColumnDef, DbErr, DeriveMigrationName, DeriveIden, ForeignKey, ForeignKeyAction,
    MigrationTrait, SchemaManager, Table
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 创建用户表
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Users::Username).string().not_null().unique_key())
                    .col(ColumnDef::new(Users::Email).string().not_null().unique_key())
                    .col(ColumnDef::new(Users::PasswordHash).string().not_null())
                    .col(ColumnDef::new(Users::FullName).string())
                    .col(ColumnDef::new(Users::AvatarUrl).string())
                    .col(ColumnDef::new(Users::IsActive).boolean().not_null().default(true))
                    .col(ColumnDef::new(Users::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Users::UpdatedAt).timestamp().not_null())
                    .to_owned(),
            )
            .await?;

        // 创建项目表
        manager
            .create_table(
                Table::create()
                    .table(Projects::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Projects::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Projects::Name).string().not_null())
                    .col(ColumnDef::new(Projects::Description).string())
                    .col(ColumnDef::new(Projects::RepositoryUrl).string())
                    .col(ColumnDef::new(Projects::OwnerId).integer().not_null())
                    .col(ColumnDef::new(Projects::IsActive).boolean().not_null().default(true))
                    .col(ColumnDef::new(Projects::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Projects::UpdatedAt).timestamp().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_projects_owner")
                            .from(Projects::Table, Projects::OwnerId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建应用表
        manager
            .create_table(
                Table::create()
                    .table(Applications::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Applications::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Applications::Name).string().not_null())
                    .col(ColumnDef::new(Applications::Description).string())
                    .col(ColumnDef::new(Applications::ProjectId).integer().not_null())
                    .col(ColumnDef::new(Applications::AppType).string().not_null())
                    .col(ColumnDef::new(Applications::Config).text())
                    .col(ColumnDef::new(Applications::IsActive).boolean().not_null().default(true))
                    .col(ColumnDef::new(Applications::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Applications::UpdatedAt).timestamp().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_applications_project")
                            .from(Applications::Table, Applications::ProjectId)
                            .to(Projects::Table, Projects::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建角色表
        manager
            .create_table(
                Table::create()
                    .table(Roles::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Roles::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Roles::Name).string().not_null().unique_key())
                    .col(ColumnDef::new(Roles::Description).string())
                    .col(ColumnDef::new(Roles::IsActive).boolean().not_null().default(true))
                    .col(ColumnDef::new(Roles::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Roles::UpdatedAt).timestamp().not_null())
                    .to_owned(),
            )
            .await?;

        // 创建权限表
        manager
            .create_table(
                Table::create()
                    .table(Permissions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Permissions::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Permissions::Name).string().not_null().unique_key())
                    .col(ColumnDef::new(Permissions::Description).string())
                    .col(ColumnDef::new(Permissions::Resource).string().not_null())
                    .col(ColumnDef::new(Permissions::Action).string().not_null())
                    .col(ColumnDef::new(Permissions::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Permissions::UpdatedAt).timestamp().not_null())
                    .to_owned(),
            )
            .await?;

        // 创建用户角色关联表
        manager
            .create_table(
                Table::create()
                    .table(UserRoles::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UserRoles::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(UserRoles::UserId).integer().not_null())
                    .col(ColumnDef::new(UserRoles::RoleId).integer().not_null())
                    .col(ColumnDef::new(UserRoles::CreatedAt).timestamp().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_user_roles_user")
                            .from(UserRoles::Table, UserRoles::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_user_roles_role")
                            .from(UserRoles::Table, UserRoles::RoleId)
                            .to(Roles::Table, Roles::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建角色权限关联表
        manager
            .create_table(
                Table::create()
                    .table(RolePermissions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(RolePermissions::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(RolePermissions::RoleId).integer().not_null())
                    .col(ColumnDef::new(RolePermissions::PermissionId).integer().not_null())
                    .col(ColumnDef::new(RolePermissions::CreatedAt).timestamp().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_role_permissions_role")
                            .from(RolePermissions::Table, RolePermissions::RoleId)
                            .to(Roles::Table, Roles::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_role_permissions_permission")
                            .from(RolePermissions::Table, RolePermissions::PermissionId)
                            .to(Permissions::Table, Permissions::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建部署表
        manager
            .create_table(
                Table::create()
                    .table(Deployments::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Deployments::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Deployments::ApplicationId).integer().not_null())
                    .col(ColumnDef::new(Deployments::Version).string().not_null())
                    .col(ColumnDef::new(Deployments::Environment).string().not_null())
                    .col(ColumnDef::new(Deployments::Status).string().not_null())
                    .col(ColumnDef::new(Deployments::Config).text())
                    .col(ColumnDef::new(Deployments::DeployedAt).timestamp())
                    .col(ColumnDef::new(Deployments::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Deployments::UpdatedAt).timestamp().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_deployments_application")
                            .from(Deployments::Table, Deployments::ApplicationId)
                            .to(Applications::Table, Applications::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建机器表
        manager
            .create_table(
                Table::create()
                    .table(Machines::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Machines::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Machines::Name).string().not_null())
                    .col(ColumnDef::new(Machines::Hostname).string().not_null())
                    .col(ColumnDef::new(Machines::IpAddress).string().not_null())
                    .col(ColumnDef::new(Machines::MachineType).string().not_null())
                    .col(ColumnDef::new(Machines::Status).string().not_null())
                    .col(ColumnDef::new(Machines::Specs).text())
                    .col(ColumnDef::new(Machines::IsActive).boolean().not_null().default(true))
                    .col(ColumnDef::new(Machines::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Machines::UpdatedAt).timestamp().not_null())
                    .to_owned(),
            )
            .await?;

        // 创建配置表
        manager
            .create_table(
                Table::create()
                    .table(Configurations::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Configurations::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Configurations::Key).string().not_null().unique_key())
                    .col(ColumnDef::new(Configurations::Value).text().not_null())
                    .col(ColumnDef::new(Configurations::Description).string())
                    .col(ColumnDef::new(Configurations::IsEncrypted).boolean().not_null().default(false))
                    .col(ColumnDef::new(Configurations::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Configurations::UpdatedAt).timestamp().not_null())
                    .to_owned(),
            )
            .await?;

        // 创建日志表
        manager
            .create_table(
                Table::create()
                    .table(Logs::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Logs::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Logs::Level).string().not_null())
                    .col(ColumnDef::new(Logs::Message).text().not_null())
                    .col(ColumnDef::new(Logs::Module).string())
                    .col(ColumnDef::new(Logs::UserId).integer())
                    .col(ColumnDef::new(Logs::Metadata).text())
                    .col(ColumnDef::new(Logs::CreatedAt).timestamp().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_logs_user")
                            .from(Logs::Table, Logs::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Logs::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Configurations::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Machines::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Deployments::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(RolePermissions::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(UserRoles::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Permissions::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Roles::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Applications::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Projects::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Username,
    Email,
    PasswordHash,
    FullName,
    AvatarUrl,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Projects {
    Table,
    Id,
    Name,
    Description,
    RepositoryUrl,
    OwnerId,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Applications {
    Table,
    Id,
    Name,
    Description,
    ProjectId,
    AppType,
    Config,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Roles {
    Table,
    Id,
    Name,
    Description,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Permissions {
    Table,
    Id,
    Name,
    Description,
    Resource,
    Action,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum UserRoles {
    Table,
    Id,
    UserId,
    RoleId,
    CreatedAt,
}

#[derive(DeriveIden)]
enum RolePermissions {
    Table,
    Id,
    RoleId,
    PermissionId,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Deployments {
    Table,
    Id,
    ApplicationId,
    Version,
    Environment,
    Status,
    Config,
    DeployedAt,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Machines {
    Table,
    Id,
    Name,
    Hostname,
    IpAddress,
    MachineType,
    Status,
    Specs,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Configurations {
    Table,
    Id,
    Key,
    Value,
    Description,
    IsEncrypted,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Logs {
    Table,
    Id,
    Level,
    Message,
    Module,
    UserId,
    Metadata,
    CreatedAt,
}