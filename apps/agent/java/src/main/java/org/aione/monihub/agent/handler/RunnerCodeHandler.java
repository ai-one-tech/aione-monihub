package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.util.CommonUtils;
import org.aione.monihub.agent.util.TaskTempUtils;
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

        String className = CommonUtils.getClassName(code);
        if (Strings.isBlank(className)) {
            return TaskExecutionResult.failure("没有识别到类名");
        }

        Path srcDir = TaskTempUtils.ensureSubDir("code", "src");
        Path classesDir = TaskTempUtils.ensureSubDir("code", "classes");
        String fileName = className + ".java";
        Path filePath = srcDir.resolve(fileName);

        if (Files.exists(filePath)) {
            Files.deleteIfExists(filePath);
        }
        Path file = Files.createFile(filePath);
        try {
            try (FileWriter writer = new FileWriter(file.toFile())) {
                writer.write(code);
            }
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            int compilationResult = compiler.run(null, null, null, "-d", classesDir.toString(), "-proc:none", file.toAbsolutePath().toString());
            if (compilationResult == 0) {
                URLClassLoader classLoader = URLClassLoader.newInstance(new URL[]{new File(classesDir.toAbsolutePath().toString()).toURI().toURL()});
                Class<?> clazz = Class.forName("org.aione.monihub.agent.codes." + className, true, classLoader);
                Object instance = clazz.getDeclaredConstructor().newInstance();
                Method method = clazz.getMethod("runner", TaskDispatchItem.class);
                @SuppressWarnings("unchecked")
                Map<String, Object> runnerResult = (Map<String, Object>) method.invoke(instance, task);
                TaskExecutionResult r = new TaskExecutionResult();
                r.put("output", runnerResult);
                r.setStatus(TaskStatus.success);
                return r;
            } else {
                TaskExecutionResult r = new TaskExecutionResult();
                r.setStatus(TaskStatus.failed);
                r.setErrorMessage("编译失败");
                r.setResultCode(compilationResult);
                return r;
            }
        } finally {
            try {
                Files.deleteIfExists(file);
            } catch (Exception e) {
                log.warn("Failed to delete temporary script file: {}", file, e);
            }
        }

    }

    @Override
    public TaskType getTaskType() {
        return TaskType.run_code;
    }
}
