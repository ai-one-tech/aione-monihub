package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;

import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
import java.io.File;
import java.io.FileWriter;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Shell脚本执行处理器
 */
public class RunnerCodeHandler implements TaskHandler {

    private AgentLogger log;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(RunnerCodeHandler.class);
    }

    @Override
    public TaskExecutionResult execute(TaskDispatchItem task) throws Exception {

        Map<String, Object> taskContent = task.getTaskContent();
        // 获取脚本内容
        String code = (String) taskContent.get("code");
        if (code == null || code.trim().isEmpty()) {
            return TaskExecutionResult.failure("没有需要执行的代码");
        }

        log.info("Executing code with content length: {}", code.length());

        // 创建临时脚本文件
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "monihub", "task");
        Files.createDirectories(tempDir);
        String fileName = "Code" + task.getTaskId() + ".java";
//        Path file = Files.createTempFile(tempDir, "task_", scriptExtension);
        Path file = Files.createFile(Paths.get("./", fileName));

        try {
            // 写入脚本内容
            try (FileWriter writer = new FileWriter(file.toFile())) {
                writer.write(code);
            }
            return executeScript(file.toFile(), task);
        } catch (Exception e) {
            return TaskExecutionResult.failure(e.getMessage());
        } finally {
            // 清理临时文件
            try {
//                Files.deleteIfExists(file);
            } catch (Exception e) {
                log.warn("Failed to delete temporary script file: {}", file, e);
            }
        }
    }

    /**
     * 执行脚本文件
     */
    private TaskExecutionResult executeScript(File file, TaskDispatchItem task) throws Exception {
        TaskExecutionResult result = new TaskExecutionResult();

        // 使用Java Compiler API编译.java文件
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        compiler.run(null, null, null, file.getName());
        // 加载编译后的类
        URLClassLoader classLoader = URLClassLoader.newInstance(new URL[]{new File("").toURI().toURL()});
        Class<?> clazz = Class.forName("org.aione.monihub.agent.handler.TestRunCode", true, classLoader);
        // 创建实例并执行runner方法
        Object instance = clazz.getDeclaredConstructor().newInstance();
        Method method = clazz.getMethod("runner", TaskDispatchItem.class);

        // 调用方法
        Map<String, Object> runnerResult = (Map<String, Object>) method.invoke(instance, task);

        result.put("output", runnerResult);

        return result;
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.run_code;
    }
}