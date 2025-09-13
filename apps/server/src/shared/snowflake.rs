use once_cell::sync::Lazy;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use rand::Rng;

/// Snowflake ID 生成器
/// 
/// Snowflake ID 结构（64位）：
/// - 1位符号位（固定为0）
/// - 41位时间戳（毫秒级，从自定义纪元开始）
/// - 10位机器ID（数据中心ID + 工作机器ID）
/// - 12位序列号（毫秒内的序列号）
pub struct SnowflakeGenerator {
    /// 自定义纪元（2020-01-01 00:00:00 UTC 的毫秒时间戳）
    epoch: u64,
    /// 机器ID（10位，0-1023）
    machine_id: u64,
    /// 序列号（12位，0-4095）
    sequence: u64,
    /// 上次生成ID的时间戳
    last_timestamp: u64,
}

impl SnowflakeGenerator {
    /// 创建新的 Snowflake 生成器
    /// 
    /// # Arguments
    /// 
    /// * `machine_id` - 机器ID（0-1023），如果为None则随机生成
    pub fn new(machine_id: Option<u64>) -> Self {
        let machine_id = machine_id.unwrap_or_else(|| {
            rand::thread_rng().gen_range(0..1024)
        });
        
        if machine_id > 1023 {
            panic!("Machine ID must be between 0 and 1023");
        }

        Self {
            // 2020-01-01 00:00:00 UTC 的毫秒时间戳
            epoch: 1577836800000,
            machine_id,
            sequence: 0,
            last_timestamp: 0,
        }
    }

    /// 生成下一个 Snowflake ID
    pub fn next_id(&mut self) -> Result<u64, String> {
        let mut timestamp = self.current_timestamp()?;

        // 如果当前时间小于上次生成时间，说明时钟回退了
        if timestamp < self.last_timestamp {
            return Err(format!(
                "Clock moved backwards. Refusing to generate id for {} milliseconds",
                self.last_timestamp - timestamp
            ));
        }

        // 如果是同一毫秒内生成的ID，序列号递增
        if timestamp == self.last_timestamp {
            self.sequence = (self.sequence + 1) & 0xFFF; // 12位序列号掩码
            
            // 如果序列号溢出，等待下一毫秒
            if self.sequence == 0 {
                timestamp = self.wait_next_millis(self.last_timestamp)?;
            }
        } else {
            // 新的毫秒，序列号重置为0
            self.sequence = 0;
        }

        self.last_timestamp = timestamp;

        // 组装 Snowflake ID
        let id = ((timestamp - self.epoch) << 22) // 时间戳部分（41位）
            | (self.machine_id << 12)             // 机器ID部分（10位）
            | self.sequence;                      // 序列号部分（12位）

        Ok(id)
    }

    /// 获取当前时间戳（毫秒）
    fn current_timestamp(&self) -> Result<u64, String> {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .map_err(|e| format!("Failed to get current timestamp: {}", e))
    }

    /// 等待下一毫秒
    fn wait_next_millis(&self, last_timestamp: u64) -> Result<u64, String> {
        let mut timestamp = self.current_timestamp()?;
        while timestamp <= last_timestamp {
            timestamp = self.current_timestamp()?;
        }
        Ok(timestamp)
    }

    /// 从 Snowflake ID 中提取时间戳
    pub fn extract_timestamp(&self, snowflake_id: u64) -> u64 {
        (snowflake_id >> 22) + self.epoch
    }

    /// 从 Snowflake ID 中提取机器ID
    pub fn extract_machine_id(&self, snowflake_id: u64) -> u64 {
        (snowflake_id >> 12) & 0x3FF // 10位机器ID掩码
    }

    /// 从 Snowflake ID 中提取序列号
    pub fn extract_sequence(&self, snowflake_id: u64) -> u64 {
        snowflake_id & 0xFFF // 12位序列号掩码
    }

    /// 将 Snowflake ID 转换为字符串
    pub fn to_string(snowflake_id: u64) -> String {
        snowflake_id.to_string()
    }

    /// 从字符串解析 Snowflake ID
    pub fn from_string(id_str: &str) -> Result<u64, String> {
        id_str.parse::<u64>()
            .map_err(|e| format!("Failed to parse snowflake ID: {}", e))
    }
}

/// 全局 Snowflake ID 生成器实例
static SNOWFLAKE_GENERATOR: Lazy<Mutex<SnowflakeGenerator>> = Lazy::new(|| {
    // 可以通过环境变量配置机器ID
    let machine_id = std::env::var("SNOWFLAKE_MACHINE_ID")
        .ok()
        .and_then(|s| s.parse::<u64>().ok())
        .filter(|&id| id <= 1023);

    Mutex::new(SnowflakeGenerator::new(machine_id))
});

/// 生成下一个 Snowflake ID（全局函数）
pub fn generate_snowflake_id() -> Result<String, String> {
    SNOWFLAKE_GENERATOR
        .lock()
        .map_err(|e| format!("Failed to lock snowflake generator: {}", e))?
        .next_id()
        .map(|id| id.to_string())
}

/// 从 Snowflake ID 中提取时间戳（全局函数）
pub fn extract_timestamp_from_id(id_str: &str) -> Result<u64, String> {
    let snowflake_id = SnowflakeGenerator::from_string(id_str)?;
    let generator = SNOWFLAKE_GENERATOR
        .lock()
        .map_err(|e| format!("Failed to lock snowflake generator: {}", e))?;
    Ok(generator.extract_timestamp(snowflake_id))
}

/// 验证 Snowflake ID 格式（全局函数）
pub fn validate_snowflake_id(id_str: &str) -> bool {
    SnowflakeGenerator::from_string(id_str).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;
    use std::thread;
    use std::time::Duration;

    #[test]
    fn test_snowflake_generator_creation() {
        let generator = SnowflakeGenerator::new(Some(1));
        assert_eq!(generator.machine_id, 1);
    }

    #[test]
    fn test_id_generation() {
        let mut generator = SnowflakeGenerator::new(Some(1));
        let id1 = generator.next_id().unwrap();
        let id2 = generator.next_id().unwrap();
        
        assert_ne!(id1, id2);
        assert!(id2 > id1);
    }

    #[test]
    fn test_id_uniqueness() {
        let mut generator = SnowflakeGenerator::new(Some(1));
        let mut ids = HashSet::new();
        
        for _ in 0..1000 {
            let id = generator.next_id().unwrap();
            assert!(ids.insert(id), "Duplicate ID generated: {}", id);
        }
    }

    #[test]
    fn test_extract_components() {
        let mut generator = SnowflakeGenerator::new(Some(123));
        let id = generator.next_id().unwrap();
        
        let machine_id = generator.extract_machine_id(id);
        assert_eq!(machine_id, 123);
    }

    #[test]
    fn test_string_conversion() {
        let id = 1234567890123456789u64;
        let id_str = SnowflakeGenerator::to_string(id);
        let parsed_id = SnowflakeGenerator::from_string(&id_str).unwrap();
        assert_eq!(id, parsed_id);
    }

    #[test]
    fn test_global_generator() {
        let id1 = generate_snowflake_id().unwrap();
        let id2 = generate_snowflake_id().unwrap();
        
        assert_ne!(id1, id2);
        assert!(validate_snowflake_id(&id1));
        assert!(validate_snowflake_id(&id2));
    }

    #[test]
    fn test_concurrent_generation() {
        let handles: Vec<_> = (0..10)
            .map(|_| {
                thread::spawn(|| {
                    let mut ids = Vec::new();
                    for _ in 0..100 {
                        ids.push(generate_snowflake_id().unwrap());
                    }
                    ids
                })
            })
            .collect();

        let mut all_ids = HashSet::new();
        for handle in handles {
            let ids = handle.join().unwrap();
            for id in ids {
                assert!(all_ids.insert(id.clone()), "Duplicate ID in concurrent test: {}", id);
            }
        }
    }
}