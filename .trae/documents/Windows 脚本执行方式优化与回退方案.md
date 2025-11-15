## 变更目标
- Windows 平台改为通过 `cmd.exe /c <脚本绝对路径>` 执行，避免整段命令字符串解析问题。
- 类 Unix 平台保持 `sh <脚本绝对路径>` 执行。
- 合并并稳健解码输出：优先 UTF‑8，Windows 下失败回退 GBK；当 `stdout` 为空时使用 `stderr`。
- 保持脚本按 OS 选择扩展名，保存到工作目录；不写入 BOM；必要时在类 Unix 赋可执行权限。

## 代码修改点
1. 写入脚本文件（apps/agent/rust/src/handlers/shell_exec.rs）
- 扩展名：Windows `.bat`，类 Unix `.sh`。
- 保存目录：`workdir`（若未提供，使用当前进程目录）。
- 编码：直接写入字节（UTF‑8 无 BOM）。
- 类 Unix：设置可执行权限（`0o755`）。

2. 执行命令构造
- Windows：`Command::new("cmd.exe").arg("/c").arg(script_path.as_os_str())`。
- 类 Unix：`Command::new("sh").arg(&script_path)`。
- 始终设置 `current_dir(base_dir)` 为脚本所在/指定工作目录。

3. 输出捕获与解码
- 同时读取 `stdout` 与 `stderr`；若 `stdout` 为空则使用 `stderr`。
- 解码策略：
  - 先尝试 `String::from_utf8`；
  - Windows 下如失败或包含替代符 `\uFFFD`，回退 `encoding_rs::GBK`；
  - 类 Unix 下失败则使用 `from_utf8_lossy`。
- 返回 JSON：`{"output": <文本>, "status": <exit_code>}`。

4. 清理临时脚本（可选）
- 执行完成后尝试删除脚本文件；失败则记录日志，不影响主流程。

## 验证用例
- 成功脚本（Windows）：
  - `@echo off`\n`echo 你好 Hello`
  - 预期：`status=0`、`output` 正常中文。
- 失败脚本：
  - `@echo off`\n`echo 错误 & exit /b 1`
  - 预期：`status=1`、`output` 显示错误文本（来自 `stderr` 或合并）。

## 风险与回退
- 如仍有中文编码问题：用户可在脚本首行自行加入 `chcp 65001 >nul`；我们端仍提供 GBK 回退，保证显示。
- 路径含空格不受影响（参数分开传递）。

请确认以上方案，确认后我将据此更新 Rust 代码以对齐 Java 行为。