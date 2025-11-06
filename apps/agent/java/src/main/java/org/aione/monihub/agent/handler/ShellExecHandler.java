package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskResult;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFilePermission;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Shell脚本执行处理器
 */
public class ShellExecHandler implements TaskHandler {

    private AgentLogger log;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(ShellExecHandler.class);
    }

    @Override
    public TaskResult execute(Map<String, Object> taskContent) throws Exception {
        // 获取脚本内容
        String scriptContent = (String) taskContent.get("script_content");
        if (scriptContent == null || scriptContent.trim().isEmpty()) {
            return TaskResult.failure("Shell script content is empty");
        }

        log.info("Executing shell script with content length: {}", scriptContent.length());

        // 创建临时脚本文件
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "monihub", "scripts");
        Files.createDirectories(tempDir);

        String scriptExtension = isWindows() ? ".bat" : ".sh";
        Path scriptFile = Files.createTempFile(tempDir, "monihub_script_", scriptExtension);

        try {
            // 写入脚本内容
            try (FileWriter writer = new FileWriter(scriptFile.toFile())) {
                writer.write(scriptContent);
            }

            // 设置脚本文件权限（非Windows系统）
            if (!isWindows()) {
                Set<PosixFilePermission> permissions = new HashSet<>();
                permissions.add(PosixFilePermission.OWNER_READ);
                permissions.add(PosixFilePermission.OWNER_WRITE);
                permissions.add(PosixFilePermission.OWNER_EXECUTE);
                permissions.add(PosixFilePermission.GROUP_READ);
                permissions.add(PosixFilePermission.GROUP_EXECUTE);
                permissions.add(PosixFilePermission.OTHERS_READ);
                permissions.add(PosixFilePermission.OTHERS_EXECUTE);
                Files.setPosixFilePermissions(scriptFile, permissions);
            }

            // 执行脚本
            return executeScript(scriptFile.toFile(), taskContent);

        } finally {
            // 清理临时文件
            try {
                Files.deleteIfExists(scriptFile);
            } catch (Exception e) {
                log.warn("Failed to delete temporary script file: {}", scriptFile, e);
            }
        }
    }

    /**
     * 执行脚本文件
     */
    private TaskResult executeScript(File scriptFile, Map<String, Object> taskContent) throws Exception {
        ProcessBuilder processBuilder = new ProcessBuilder();

        // 根据操作系统设置执行命令
        if (isWindows()) {
            processBuilder.command("cmd.exe", "/c", scriptFile.getAbsolutePath());
        } else {
            processBuilder.command("sh", scriptFile.getAbsolutePath());
        }

        // 设置工作目录
        String workdir = (String) taskContent.get("workdir");
        if (workdir != null && !workdir.trim().isEmpty()) {
            processBuilder.directory(new File(workdir));
        }

        // 设置环境变量
        @SuppressWarnings("unchecked")
        Map<String, String> env = (Map<String, String>) taskContent.get("env");
        if (env != null && !env.isEmpty()) {
            processBuilder.environment().putAll(env);
        }

        // 设置超时时间（默认5分钟）
        Integer timeoutSeconds = (Integer) taskContent.get("timeout_seconds");
        if (timeoutSeconds == null || timeoutSeconds <= 0) {
            timeoutSeconds = 300; // 默认5分钟
        }

        // 合并标准输出和错误输出
        processBuilder.redirectErrorStream(true);

        log.info("Executing shell script: {} with timeout: {} seconds",
                scriptFile.getAbsolutePath(), timeoutSeconds);

        // 启动进程
        Process process = processBuilder.start();

        // 读取输出
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        // 等待进程完成
        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            return TaskResult.failure("Shell script execution timeout after " + timeoutSeconds + " seconds");
        }

        int exitCode = process.exitValue();

        // 构建结果数据
        Map<String, Object> resultData = new HashMap<>();
        resultData.put("exit_code", exitCode);
        resultData.put("output", output.toString().trim());
        resultData.put("script_file", scriptFile.getAbsolutePath());

        if (exitCode == 0) {
            return TaskResult.success("Shell script executed successfully", resultData);
        } else {
            return TaskResult.failure(exitCode, "Shell script failed with exit code: " + exitCode + ", output: " + output.toString().trim());
        }
    }

    /**
     * 检查当前操作系统是否为Windows
     */
    private boolean isWindows() {
        String os = System.getProperty("os.name").toLowerCase();
        return os.contains("win");
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.SHELL_EXEC;
    }
}