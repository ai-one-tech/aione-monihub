use aione_monihub_server::shared::{
    extract_timestamp_from_id, generate_snowflake_id, validate_snowflake_id,
};
use std::collections::HashSet;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Snowflake ID 生成器演示 ===\n");

    // 1. 生成单个ID
    println!("1. 生成单个 Snowflake ID:");
    let id1 = generate_snowflake_id();
    println!("   生成的ID: {}", id1);
    println!("   ID长度: {} 位", id1.len());
    println!(
        "   ID验证: {}",
        if validate_snowflake_id(&id1) {
            "有效"
        } else {
            "无效"
        }
    );

    // 从ID提取时间戳
    if let Ok(timestamp) = extract_timestamp_from_id(&id1) {
        let datetime =
            chrono::DateTime::from_timestamp_millis(timestamp as i64).unwrap_or_default();
        println!(
            "   提取的时间戳: {} ({})",
            timestamp,
            datetime.format("%Y-%m-%d %H:%M:%S%.3f UTC")
        );
    }
    println!();

    // 2. 生成多个ID并验证唯一性
    println!("2. 生成多个ID并验证唯一性:");
    let mut ids = HashSet::new();
    let count = 100;

    for i in 0..count {
        let id = generate_snowflake_id();
        if !ids.insert(id.clone()) {
            println!("   错误: 发现重复ID: {}", id);
            return Ok(());
        }

        if i < 5 {
            // 只显示前5个ID
            println!("   ID {}: {}", i + 1, id);
        }
    }

    println!("   生成了 {} 个唯一ID", count);
    println!("   所有ID都是唯一的: {}", ids.len() == count);
    println!();

    // 3. 性能测试
    println!("3. 性能测试 (生成10000个ID):");
    let start = std::time::Instant::now();

    for _ in 0..10000 {
        let _id = generate_snowflake_id();
    }

    let duration = start.elapsed();
    println!("   耗时: {:?}", duration);
    println!("   平均每个ID: {:?}", duration / 10000);
    println!();

    // 4. 并发测试
    println!("4. 并发测试:");
    let handles: Vec<_> = (0..4)
        .map(|thread_id| {
            std::thread::spawn(move || {
                let mut local_ids = Vec::new();
                for _ in 0..1000 {
                    let id = generate_snowflake_id();
                    local_ids.push(id);
                }
                println!("   线程 {} 生成了 {} 个ID", thread_id, local_ids.len());
                local_ids
            })
        })
        .collect();

    let mut all_ids = HashSet::new();
    for handle in handles {
        let ids = handle.join().unwrap();
        for id in ids {
            if !all_ids.insert(id.clone()) {
                println!("   错误: 并发测试中发现重复ID: {}", id);
                return Ok(());
            }
        }
    }

    println!("   并发测试总共生成了 {} 个唯一ID", all_ids.len());
    println!();

    // 5. ID格式验证
    println!("5. ID格式验证:");
    let valid_ids = vec![generate_snowflake_id(), generate_snowflake_id()];

    let invalid_ids = vec![
        "invalid_id",
        "12345abc",
        "",
        "999999999999999999999999999999",
    ];

    println!("   有效ID验证:");
    for id in &valid_ids {
        println!(
            "     {} -> {}",
            id,
            if validate_snowflake_id(id) {
                "有效"
            } else {
                "无效"
            }
        );
    }

    println!("   无效ID验证:");
    for id in &invalid_ids {
        println!(
            "     {} -> {}",
            id,
            if validate_snowflake_id(id) {
                "有效"
            } else {
                "无效"
            }
        );
    }

    println!("\n=== 演示完成 ===");
    Ok(())
}
