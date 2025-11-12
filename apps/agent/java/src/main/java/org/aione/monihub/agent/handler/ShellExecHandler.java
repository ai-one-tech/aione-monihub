package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.util.CommonUtils;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFilePermission;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
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
    public TaskExecutionResult execute(TaskDispatchItem task) throws Exception {

        Map<String, Object> taskContent = task.getTaskContent();
        // 获取脚本内容
        String scriptContent = (String) taskContent.get("script");
        if (scriptContent == null || scriptContent.trim().isEmpty()) {
            return TaskExecutionResult.failure("没有需要执行的脚本");
        }

        log.info("Executing shell script with content length: {}", scriptContent.length());

        // 创建临时脚本文件
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "monihub", "task");
        Files.createDirectories(tempDir);

        String scriptExtension = CommonUtils.isWindows() ? ".bat" : ".sh";
//        Path scriptFile = Files.createTempFile(tempDir, "task_", scriptExtension);
        Path scriptFile = Files.createFile(Paths.get(tempDir.toString(), task.getTaskId() + scriptExtension));

        try {
            // 写入脚本内容
            try (FileWriter writer = new FileWriter(scriptFile.toFile())) {
                writer.write(scriptContent);
            }

            // 设置脚本文件权限（非Windows系统）
            if (!CommonUtils.isWindows()) {
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
            return executeScript(scriptFile.toFile(), task);
        } catch (Exception e) {
            return TaskExecutionResult.failure(e.getMessage());
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
    private TaskExecutionResult executeScript(File scriptFile, TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();

        TaskExecutionResult result = new TaskExecutionResult();

        ProcessBuilder processBuilder = new ProcessBuilder();

        // 根据操作系统设置执行命令
        if (CommonUtils.isWindows()) {
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
        Integer timeoutSeconds = task.getSafeTimeoutSeconds();

        // 合并标准输出和错误输出
        processBuilder.redirectErrorStream(true);

        log.info("Executing shell script: {} with timeout: {} seconds",
                scriptFile.getAbsolutePath(), timeoutSeconds);

        // 启动进程
        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();
        ExecutorService executorService = Executors.newSingleThreadExecutor();
        Future future = executorService.submit(() -> {
            // 读取输出
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        // 等待进程完成
        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        future.cancel(true);
        result.put("output", output.toString().trim());

        if (finished) {
            int exitCode = process.exitValue();
            result.setResultCode(exitCode);

            result.setStatus(TaskStatus.success);
        } else {
            process.destroy();
            result.setStatus(TaskStatus.timeout);
        }

        return result;
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.shell_exec;
    }
}