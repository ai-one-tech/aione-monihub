pub const STATUS_ACTIVE: &str = "active";
pub const STATUS_DISABLED: &str = "disabled";

pub fn is_valid_status(s: &str) -> bool {
    matches!(s, STATUS_ACTIVE | STATUS_DISABLED)
}

pub fn normalize_status(s: &str) -> &str {
    // 将历史状态统一映射：除 active 外均视为 disabled
    if s == STATUS_ACTIVE {
        STATUS_ACTIVE
    } else {
        STATUS_DISABLED
    }
}