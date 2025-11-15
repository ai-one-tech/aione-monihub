use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let profile = env::var("PROFILE").unwrap_or_else(|_| String::from("debug"));
    let src = Path::new(&manifest_dir).join("config.yaml");
    println!("cargo:rerun-if-changed={}", src.display());
    if !src.exists() {
        println!("cargo:warning=未找到配置文件: {}", src.display());
        return;
    }
    let base_target = env::var("CARGO_TARGET_DIR")
        .map(|p| Path::new(&p).to_path_buf())
        .unwrap_or_else(|_| Path::new(&manifest_dir).join("target"));

    let primary_dir = base_target.join(&profile);
    if let Err(e) = fs::create_dir_all(&primary_dir) {
        println!("cargo:warning=创建目录失败: {} - {}", primary_dir.display(), e);
    }
    let primary_dst = primary_dir.join("config.yaml");
    match fs::copy(&src, &primary_dst) {
        Ok(_) => println!("cargo:warning=已复制到 {}", primary_dst.display()),
        Err(e) => println!("cargo:warning=复制到 {} 失败: {}", primary_dst.display(), e),
    }

    if let Ok(triple) = env::var("TARGET") {
        let triple_dir = base_target.join(&triple).join(&profile);
        if let Err(e) = fs::create_dir_all(&triple_dir) {
            println!("cargo:warning=创建目录失败: {} - {}", triple_dir.display(), e);
        }
        let triple_dst = triple_dir.join("config.yaml");
        match fs::copy(&src, &triple_dst) {
            Ok(_) => println!("cargo:warning=已复制到 {}", triple_dst.display()),
            Err(e) => println!("cargo:warning=复制到 {} 失败: {}", triple_dst.display(), e),
        }
    }
}