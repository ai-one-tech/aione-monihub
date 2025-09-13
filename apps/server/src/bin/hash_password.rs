use bcrypt::{hash, DEFAULT_COST};

fn main() {
    let password = "password";
    match hash(password, DEFAULT_COST) {
        Ok(hashed) => {
            println!("密码 '{}' 的哈希值为: {}", password, hashed);
        }
        Err(e) => {
            eprintln!("生成哈希时出错: {}", e);
        }
    }

    // 生成其他测试密码的哈希
    let passwords = vec!["admin", "test123", "user123"];
    for pwd in passwords {
        match hash(pwd, DEFAULT_COST) {
            Ok(hashed) => {
                println!("密码 '{}' 的哈希值为: {}", pwd, hashed);
            }
            Err(e) => {
                eprintln!("生成 '{}' 哈希时出错: {}", pwd, e);
            }
        }
    }
}
