package org.aione.monihub.agent.executor;

import org.aione.monihub.agent.config.AgentProperties;
import org.aione.monihub.agent.handler.TaskHandler;
import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskResult;
import org.aione.monihub.agent.util.AgentLogger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * 任务执行器
 */
@Component("agentTaskExecutor")
public class TaskExecutor {
    
    private AgentLogger log;
    
    private final Map<String, TaskHandler> handlers = new HashMap<>();
    private ExecutorService executorService;
    
    @javax.annotation.Resource
    private AgentProperties properties;
    
    @javax.annotation.Resource
    private List<TaskHandler> taskHandlers;
    
    @javax.annotation.PostConstruct
    public void init() {
        // 初始化日志
        this.log = new AgentLogger(LoggerFactory.getLogger(TaskExecutor.class), properties);
        
        // 创建线程池，最多并发执行3个任务
        this.executorService = new ThreadPoolExecutor(
            3,
            3,
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100),
            new ThreadFactory() {
                private int counter = 0;
                @Override
                public Thread newThread(Runnable r) {
                    Thread thread = new Thread(r, "task-executor-" + (counter++));
                    thread.setDaemon(true);
                    return thread;
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
        // 注册所有任务处理器
        initHandlers();
    }
    
    /**
     * 初始化任务处理器
     */
    private void initHandlers() {
        if (taskHandlers != null && !taskHandlers.isEmpty()) {
            for (TaskHandler handler : taskHandlers) {
                String taskType = handler.getTaskType();
                handlers.put(taskType, handler);
                log.info("Registered task handler: {}", taskType);
            }
        }
    }
    
    /**
     * 执行任务
     * 
     * @param task 任务项
     * @return 执行结果
     */
    public TaskExecutionResult execute(TaskDispatchItem task) {
        long startTime = System.currentTimeMillis();
        TaskResult result;
        String status;
        String errorMessage = null;
        
        try {
            // 查找任务处理器
            TaskHandler handler = handlers.get(task.getTaskType());
            if (handler == null) {
                log.error("No handler found for task type: {}", task.getTaskType());
                result = TaskResult.failure("Unsupported task type: " + task.getTaskType());
                status = "failed";
            } else {
                // 使用Future进行超时控制
                Integer timeoutSeconds = task.getTimeoutSeconds();
                if (timeoutSeconds == null || timeoutSeconds <= 0) {
                    timeoutSeconds = 300; // 默认5分钟
                }
                
                Future<TaskResult> future = executorService.submit(() -> 
                    handler.execute(task.getTaskContent())
                );
                
                try {
                    result = future.get(timeoutSeconds, TimeUnit.SECONDS);
                    status = result.getCode() == 0 ? "success" : "failed";
                } catch (TimeoutException e) {
                    future.cancel(true);
                    log.error("Task execution timeout: {}", task.getTaskId(), e);
                    result = TaskResult.failure(-1, "Task execution timeout");
                    status = "timeout";
                    errorMessage = "Task execution timeout after " + timeoutSeconds + " seconds";
                } catch (ExecutionException e) {
                    log.error("Task execution error: {}", task.getTaskId(), e);
                    Throwable cause = e.getCause();
                    result = TaskResult.failure(cause != null ? cause.getMessage() : e.getMessage());
                    status = "failed";
                    errorMessage = cause != null ? cause.getMessage() : e.getMessage();
                }
            }
        } catch (Exception e) {
            log.error("Unexpected error executing task: {}", task.getTaskId(), e);
            result = TaskResult.failure(e.getMessage());
            status = "failed";
            errorMessage = e.getMessage();
        }
        
        long endTime = System.currentTimeMillis();
        long durationMs = endTime - startTime;
        
        return new TaskExecutionResult(
            status,
            result.getCode(),
            result.getMessage(),
            result.getData(),
            errorMessage,
            startTime,
            endTime,
            durationMs
        );
    }
    
    /**
     * 关闭执行器
     */
    public void shutdown() {
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(10, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * 任务执行结果
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class TaskExecutionResult {
        private String status;
        private Integer resultCode;
        private String resultMessage;
        private Map<String, Object> resultData;
        private String errorMessage;
        private long startTime;
        private long endTime;
        private long durationMs;
    }
}
