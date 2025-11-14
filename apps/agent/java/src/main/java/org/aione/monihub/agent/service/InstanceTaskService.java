package org.aione.monihub.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.config.InstanceConfig;
import org.aione.monihub.agent.executor.AgentTaskExecutor;
import org.aione.monihub.agent.model.*;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.util.CommonUtils;

import java.net.SocketTimeoutException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 任务拉取服务
 */
public class InstanceTaskService {

    private AgentLogger log;

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    @javax.annotation.Resource
    private AgentConfig agentConfig;

    @javax.annotation.Resource
    private OkHttpClient httpClient;

    @javax.annotation.Resource
    private AgentTaskExecutor agentTaskExecutor;

    private ScheduledExecutorService scheduler;
    private volatile boolean running;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(InstanceTaskService.class);
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread thread = new Thread(r, "task-poller");
            thread.setDaemon(true);
            return thread;
        });

        // 任务配置由 AgentConfig 下发并动态生效
    }

    /**
     * 启动任务拉取服务
     */
    public void start() {
        log.info("Starting task service");
        running = true;
        scheduler.execute(() -> {
            while (running) {
                pollTasks();
            }
        });
    }

    /**
     * 停止任务拉取服务
     */
    public void stop() {
        log.info("Stopping task service");
        running = false;
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }

        agentTaskExecutor.shutdown();
    }

    /**
     * 拉取任务
     */
    private void pollTasks() {
        try {
            ObjectMapper objectMapper = CommonUtils.getObjectMapper();
            InstanceConfig.TaskConfig taskCfg = agentConfig.getTask();

            if (taskCfg == null || !taskCfg.isEnabled()) {
                log.info("Task service is disabled");
                return;
            }
            log.info("Polling tasks for instance: {}", agentConfig.getInstanceId());

            // 构建拉取任务的URL
            String url = agentConfig.getServerUrl() + "/api/open/instances/tasks?agent_instance_id=" + agentConfig.getInstanceId();

            int timeoutSeconds = taskCfg.getLongPollTimeoutSeconds();
            if (timeoutSeconds > 0) {
                url += "&wait=true&timeout=" + timeoutSeconds;
            }

            log.info("Polling tasks from: {}", url);

            Request request = new Request.Builder()
                    .url(url)
                    .get()
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body() != null ? response.body().string() : "";
                    TaskDispatchResponse taskResponse = objectMapper.readValue(
                            responseBody, TaskDispatchResponse.class);

                    if (taskResponse.getTasks() != null && !taskResponse.getTasks().isEmpty()) {
                        log.info("Received {} tasks", taskResponse.getTasks().size());

                        // 处理每个任务
                        for (TaskDispatchItem task : taskResponse.getTasks()) {
                            processTask(task);
                        }
                    } else {
                        log.debug("No pending tasks");
                    }
                } else {
                    log.warn("Failed to poll tasks, status: {}", response.code());
                }
            }

        } catch (SocketTimeoutException e) {
            log.info("next polling tasks");
        } catch (Exception e) {
            log.error("Error polling tasks", e);
            try {
                Thread.sleep(1000 * 5);
            } catch (InterruptedException ignore) {
            }
        }
    }

    /**
     * 处理任务
     */
    private void processTask(TaskDispatchItem task) {
        log.info("Processing task: {} ({})", task.getTaskId(), task.getTaskType());

        // 异步执行任务
        scheduler.execute(() -> {
            try {

                // 执行任务
                TaskExecutionResult result = agentTaskExecutor.execute(task);

                // 提交结果
                submitResult(task, result);

            } catch (Exception e) {
                log.error("Error processing task: {}", task.getTaskId(), e);

                // 提交失败结果
                try {
                    TaskExecutionResult failedResult = new TaskExecutionResult();
                    failedResult.setStatus(TaskStatus.failed);
                    failedResult.setErrorMessage(e.getMessage());
                    submitResult(task, failedResult);
                } catch (Exception ex) {
                    log.error("Failed to submit error result", ex);
                }
            }
        });
    }

    /**
     * 提交任务结果
     */
    private void submitResult(TaskDispatchItem task, TaskExecutionResult result) {
        int maxRetries = 10;
        int retryCount = 0;

        ObjectMapper objectMapper = CommonUtils.getObjectMapper();

        while (retryCount < maxRetries) {
            try {
                TaskResultSubmitRequest request = new TaskResultSubmitRequest();
                request.setRecordId(task.getRecordId());
                request.setAgentInstanceId(agentConfig.getInstanceId());
                request.setStatus(result.getStatus());
                request.setResultCode(result.getResultCode());
                request.setResultMessage(result.getResultMessage());
                request.setResultData(result.getResultData());
                request.setErrorMessage(result.getErrorMessage());
                request.setStartTime(formatTime(result.getStartTime()));
                request.setEndTime(formatTime(result.getEndTime()));
                request.setDurationMs(result.getDurationMs());

                String json = objectMapper.writeValueAsString(request);
                String url = agentConfig.getServerUrl() + "/api/open/instances/tasks/result";

                log.info("Sending task result to {}: {}", url, json);

                RequestBody body = RequestBody.create(JSON, json);
                Request httpRequest = new Request.Builder()
                        .url(url)
                        .post(body)
                        .build();

                try (Response response = httpClient.newCall(httpRequest).execute()) {
                    if (response.isSuccessful()) {
                        log.info("Task result submitted successfully: {}", task.getTaskId());
                        return; // 成功提交，退出重试循环
                    } else {
                        log.warn("Failed to submit task result, status: {}, attempt: {}",
                                response.code(), retryCount + 1);
                    }
                }

            } catch (Exception e) {
                log.error("Error submitting task result, attempt: {}", retryCount + 1, e);
            }

            retryCount++;
            if (retryCount < maxRetries) {
                try {
                    // 指数退避：1秒、2秒、4秒
                    Thread.sleep((long) Math.pow(2, retryCount - 1) * 1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        log.error("Failed to submit task result after {} attempts: {}", maxRetries, task.getTaskId());
    }

    /**
     * 格式化时间为ISO 8601格式
     */
    private String formatTime(long timestamp) {
        return ZonedDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(timestamp),
                java.time.ZoneId.systemDefault()
        ).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
