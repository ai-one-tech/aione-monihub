package org.aione.monihub.agent.executor;

import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.handler.TaskHandler;
import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * 任务执行器
 */
public class AgentTaskExecutor {

    private AgentLogger log;

    private final Map<TaskType, TaskHandler> handlers = new HashMap<>();
    private ExecutorService executorService;

    @javax.annotation.Resource
    private List<TaskHandler> taskHandlers;

    @javax.annotation.PostConstruct
    public void init() {
        // 初始化日志
        this.log = AgentLoggerFactory.getLogger(AgentTaskExecutor.class);

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
                TaskType taskType = handler.getTaskType();
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
        TaskExecutionResult result = new TaskExecutionResult();

        try {
            // 查找任务处理器
            TaskHandler handler = handlers.get(task.getTaskType());
            if (handler == null) {
                log.error("No handler found for task type: {}", task.getTaskType());
                result.setErrorMessage("Unsupported task type: " + task.getTaskType());
                result.setStatus(TaskStatus.failed);
            } else {
                // 使用Future进行超时控制
                Integer timeoutSeconds = task.getTimeoutSeconds();

                Future<TaskExecutionResult> future = executorService.submit(() ->
                        handler.execute(task)
                );

                try {
                    result = future.get(timeoutSeconds, TimeUnit.SECONDS);
                } catch (TimeoutException e) {
                    future.cancel(true);
                    result.setErrorMessage("Task execution timeout");
                    result.setStatus(TaskStatus.timeout);
                } catch (ExecutionException e) {
                    Throwable cause = e.getCause();
                    result.setErrorMessage(cause != null ? cause.getMessage() : e.getMessage());
                    result.setStatus(TaskStatus.failed);
                }
            }
        } catch (Exception e) {
            result.setErrorMessage(e.getMessage());
            result.setStatus(TaskStatus.failed);
        }

        long endTime = System.currentTimeMillis();
        long durationMs = endTime - startTime;
        result.setStartTime(startTime);
        result.setEndTime(endTime);
        result.setDurationMs(durationMs);

        return result;
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

}