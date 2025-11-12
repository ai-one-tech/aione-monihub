package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.util.CommonUtils;
import org.apache.logging.log4j.util.Strings;

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

        TaskExecutionResult result = new TaskExecutionResult();

        Map<String, Object> taskContent = task.getTaskContent();
        // 获取脚本内容
        String code = (String) taskContent.get("code");
        if (code == null || code.trim().isEmpty()) {
            return TaskExecutionResult.failure("没有需要执行的代码");
        }

        log.info("Executing code with content length: {}", code.length());

        String className = CommonUtils.getClassName(code);
        if (Strings.isBlank(className)) {
            return TaskExecutionResult.failure("没有识别到类名");
        }

        // 创建临时脚本文件
        Path srcDir = Paths.get("tmp", "monihub", "task", "src");
        Path classesDir = Paths.get("tmp", "monihub", "task", "classes");
        Files.createDirectories(srcDir);
        Files.createDirectories(classesDir);

        String fileName = className + ".java";
        Path file = Files.createFile(Paths.get(srcDir.toAbsolutePath().toString(), fileName));

        try {
            // 写入脚本内容
            try (FileWriter writer = new FileWriter(file.toFile())) {
                writer.write(code);
            }

            // 使用Java Compiler API编译.java文件
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            int compilationResult = compiler.run(null, null, null, "-d", classesDir.toString(), "-proc:none", file.toAbsolutePath().toString());
            if (compilationResult == 0) {
                // 加载编译后的类
                URLClassLoader classLoader = URLClassLoader.newInstance(new URL[]{new File(classesDir.toAbsolutePath().toString()).toURI().toURL()});
                Class<?> clazz = Class.forName("org.aione.monihub.agent.codes." + className, true, classLoader);
                // 创建实例并执行runner方法
                Object instance = clazz.getDeclaredConstructor().newInstance();
                Method method = clazz.getMethod("runner", TaskDispatchItem.class);

                // 调用方法
                @SuppressWarnings("unchecked")
                Map<String, Object> runnerResult = (Map<String, Object>) method.invoke(instance, task);

                result.put("output", runnerResult);

                result.setStatus(TaskStatus.success);
            } else {
                result.setStatus(TaskStatus.failed);
                result.setErrorMessage("编译失败");
                result.setResultCode(compilationResult);
            }

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
        return result;
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.run_code;
    }
}