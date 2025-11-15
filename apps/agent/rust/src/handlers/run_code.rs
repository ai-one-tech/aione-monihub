/// 动态运行 Java 代码处理器（兼容 Java Agent）
///
/// 任务内容示例：
/// {
///   "code": "public class Xxx { public static Map runner(Map m){ return m; } }"
/// }
/// 实现：将代码写入临时目录，使用 `javac` 编译，随后通过 `java -cp` 反射调用 `runner` 方法。
/// 注意：容器必须安装 JDK，否则执行会失败。
use crate::models::TaskDispatchItem;
use anyhow::Result;
use std::fs;
use std::path::PathBuf;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

pub async fn execute(item: &TaskDispatchItem, timeout_sec: u64) -> Result<serde_json::Value> {
    let code = item
        .task_content
        .get("code")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let class_name = parse_class_name(code).unwrap_or("RunnerCode").to_string();
    let base = temp_base();
    let src_dir = base.join("src");
    let cls_dir = base.join("classes");
    fs::create_dir_all(&src_dir)?;
    fs::create_dir_all(&cls_dir)?;
    let src_file = src_dir.join(format!("{}.java", class_name));
    fs::write(&src_file, code)?;
    let wrapper = src_dir.join("__RunnerWrapper.java");
    fs::write(&wrapper, wrapper_source(&class_name))?;
    let fut = async move {
        let _ = Command::new("javac")
            .arg("-d")
            .arg(&cls_dir)
            .arg(&src_file)
            .arg(&wrapper)
            .output()
            .await?;
        let out = Command::new("java")
            .arg("-cp")
            .arg(&cls_dir)
            .arg("__RunnerWrapper")
            .output()
            .await?;
        let s = String::from_utf8_lossy(&out.stdout).to_string();
        Ok(serde_json::from_str::<serde_json::Value>(&s)
            .unwrap_or(serde_json::json!({"output": s})))
    };
    let r = timeout(Duration::from_secs(timeout_sec), fut).await;
    match r {
        Ok(v) => v,
        Err(_) => Err(anyhow::anyhow!("timeout")),
    }
}

fn parse_class_name(src: &str) -> Option<&str> {
    let t = src.split_whitespace().collect::<Vec<_>>();
    let mut i = 0;
    while i + 1 < t.len() {
        if t[i] == "class" {
            return Some(t[i + 1]);
        }
        i += 1;
    }
    None
}

fn temp_base() -> PathBuf {
    std::env::temp_dir().join("monihub").join("code")
}

fn wrapper_source(target: &str) -> String {
    format!("public class __RunnerWrapper {{ public static void main(String[] args) throws Exception {{ Class<?> c = Class.forName(\"{}\"); java.lang.reflect.Method m = c.getMethod(\"runner\", java.util.Map.class); java.util.Map res = (java.util.Map) m.invoke(null, new java.util.HashMap()); System.out.print(String.valueOf(res)); }} }}", target)
}
