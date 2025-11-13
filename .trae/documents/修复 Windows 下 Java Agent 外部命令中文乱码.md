# 问题原因
- 在 `apps/agent/java/src/main/java/org/aione/monihub/agent/handler/ShellExecHandler.java:128` 使用 `StandardCharsets.UTF_8` 解码子进程输出；但 Windows `cmd.exe` 默认代码页为 `CP936/GBK`，导致中文输出被按 UTF-8 读取而乱码。
- 执行命令入口在 `ShellExecHandler.java:95`：`cmd.exe /c <script>`，脚本内容写入使用 `FileWriter`，未指定编码，受系统默认编码影响（`ShellExecHandler.java:58-60`）。

# 修复方案
## 方案 A（推荐，最小改动）
- 在 Windows 上针对进程输出使用 `GBK` 解码；非 Windows 保持 `UTF-8`。
- 优点：改动小、对现有 `.bat/.cmd` 与原生命令兼容性好。
- 缺点：若外部程序本身输出 UTF-8，可能仍存在不兼容。

## 方案 B（统一 UTF-8）
- 强制在 `cmd.exe` 中先切至 `65001` 代码页，再执行脚本；统一以 `UTF-8` 读写。
- 同步将脚本文件写入编码改为 `UTF-8`，避免脚本在 65001 下解析乱码。
- 优点：端到端统一 UTF-8，跨平台一致性更好。
- 缺点：部分老旧 Windows 命令对 `65001` 支持不佳，需要实际验证。

## 方案 C（PowerShell 路径，可选）
- 若脚本为 `.ps1`，改用 PowerShell，并在命令前设置 `OutputEncoding=UTF8`，以统一 UTF-8。
- 仅在需要执行 PowerShell 的场景采用。

# 具体修改点
## 方案 A 修改
- 文件：`apps/agent/java/src/main/java/org/aione/monihub/agent/handler/ShellExecHandler.java`
  - 将 `ShellExecHandler.java:127-133` 中的读取编码改为：
    - `Charset charset = CommonUtils.isWindows() ? Charset.forName("GBK") : StandardCharsets.UTF_8;`
    - `new BufferedReader(new InputStreamReader(process.getInputStream(), charset))`

## 方案 B 修改
- 文件：`apps/agent/java/src/main/java/org/aione/monihub/agent/handler/ShellExecHandler.java`
  - 命令行（`ShellExecHandler.java:95`）：
    - 改为：`processBuilder.command("cmd.exe", "/c", "chcp 65001 >NUL & \"" + scriptFile.getAbsolutePath() + "\"");`
  - 写脚本（`ShellExecHandler.java:58-60`）：
    - 改为：`try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(scriptFile.toFile()), StandardCharsets.UTF_8)) { writer.write(scriptContent); }`
  - 读取输出（`ShellExecHandler.java:127-133`）：
    - 保持 `StandardCharsets.UTF_8`。

## 方案 C 修改（仅 `.ps1`）
- 文件：`ShellExecHandler.java:95-98`
  - Windows 分支改为：`processBuilder.command("powershell", "-NoProfile", "-Command", "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(0,$false); & '" + scriptFile.getAbsolutePath() + "'");`
  - 与方案 B 一样，脚本写入与输出读取均使用 `UTF-8`。

# 验证步骤
- 构造脚本包含中文输出：`echo 你好，世界`（Windows `.bat` 与 Linux `.sh`）。
- 在 Windows 与 Linux 下执行 `shell_exec` 任务，检查 `TaskExecutionResult.output`（`ShellExecHandler.java:155`）是否正确显示中文。
- 回归场景：
  - 长行与多字节字符；
  - 错误输出合并（`redirectErrorStream(true)`，`ShellExecHandler.java:117`）；
  - 超时与退出码处理逻辑保持不变。

# 选择建议
- 如果主要执行 Windows 原生命令与 `.bat/.cmd`，优先选择方案 A（最稳妥）。
- 若希望端到端统一 UTF-8，选择方案 B，并按上述同步修改脚本写入编码。
- PowerShell 仅在需要执行 `.ps1` 时采用方案 C。