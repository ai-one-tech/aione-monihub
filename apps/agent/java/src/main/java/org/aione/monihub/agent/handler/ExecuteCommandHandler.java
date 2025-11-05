package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.model.TaskResult;
import org.aione.monihub.agent.util.AgentLogger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 命令执行处理器
 */
public class ExecuteCommandHandler implements TaskHandler {

    private AgentLogger log;

    private static final String TASK_TYPE = "execute_command";

    @javax.annotation.Resource
    private AgentConfig properties;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = new AgentLogger(LoggerFactory.getLogger(ExecuteCommandHandler.class), properties);
    }

    @Override
    public TaskResult execute(Map<String, Object> taskContent) throws Exception {
        String command = (String) taskContent.get("command");
        if (command == null || command.trim().isEmpty()) {
            return TaskResult.failure("Command is empty");
        }

        log.info("Executing command: {}", command);

        ProcessBuilder processBuilder = new ProcessBuilder();

        // 根据操作系统设置命令
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            processBuilder.command("cmd.exe", "/c", command);
        } else {
            processBuilder.command("sh", "-c", command);
        }

        // 设置工作目录（如果提供）
        String workdir = (String) taskContent.get("workdir");
        if (workdir != null && !workdir.trim().isEmpty()) {
            processBuilder.directory(new java.io.File(workdir));
        }

        // 设置环境变量（如果提供）
        @SuppressWarnings("unchecked")
        Map<String, String> env = (Map<String, String>) taskContent.get("env");
        if (env != null && !env.isEmpty()) {
            processBuilder.environment().putAll(env);
        }

        // 合并标准输出和错误输出
        processBuilder.redirectErrorStream(true);

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

        // 等待进程完成（最多等待5分钟）
        boolean finished = process.waitFor(5, TimeUnit.MINUTES);

        if (!finished) {
            process.destroyForcibly();
            return TaskResult.failure("Command execution timeout");
        }

        int exitCode = process.exitValue();

        // 构建结果数据
        Map<String, Object> resultData = new HashMap<>();
        resultData.put("exit_code", exitCode);
        resultData.put("output", output.toString().trim());

        if (exitCode == 0) {
            return TaskResult.success("Command executed successfully", resultData);
        } else {
            return TaskResult.failure(exitCode, "Command failed with exit code: " + exitCode);
        }
    }

    @Override
    public String getTaskType() {
        return TASK_TYPE;
    }
}