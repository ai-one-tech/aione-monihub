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
import java.util.Objects;
import java.util.concurrent.ExecutorService;
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
    private ScheduledExecutorService resultScheduler;
    private volatile boolean running;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(InstanceTaskService.class);
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread thread = new Thread(r, "task-poller");
            thread.setDaemon(true);
            return thread;
        });
        this.resultScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread thread = new Thread(r, "task-result-scheduler");
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
                // 获取任务并执行
                PollOutcome outcome = pollOnce();
                switch (outcome) {
                    case TIMEOUT:
                    case TASKS_PROCESSED:
                    case NO_TASKS:
                        // 立即继续下一次轮询
                        break;
                    case DISABLED:
                        safeSleep(10000);
                        break;
                    case ERROR_NON_TIMEOUT:
                        safeSleep(3000);
                        break;
                }
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
        if (resultScheduler != null) {
            resultScheduler.shutdown();
            try {
                if (!resultScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    resultScheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                resultScheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * 拉取任务
     */
    private PollOutcome pollOnce() {
        try {
            ObjectMapper objectMapper = CommonUtils.getObjectMapper();
            InstanceConfig.TaskConfig taskCfg = agentConfig.getTask();

            if (taskCfg == null || !taskCfg.isEnabled()) {
                log.info("Task service is disabled");
                return PollOutcome.DISABLED;
            }
            log.info("Polling tasks for instance: {}", agentConfig.getAgentInstanceId());

            // 构建拉取任务的URL
            okhttp3.HttpUrl.Builder ub = Objects.requireNonNull(HttpUrl.parse(agentConfig.getServerUrl() + "/api/open/instances/tasks")).newBuilder();
            ub.addQueryParameter("agent_instance_id", agentConfig.getAgentInstanceId());

            int timeoutSeconds = taskCfg.getLongPollTimeoutSeconds();
            if (timeoutSeconds > 0) {
                ub.addQueryParameter("wait", "true");
                ub.addQueryParameter("timeout", String.valueOf(timeoutSeconds));
            }

            okhttp3.HttpUrl pollUrl = ub.build();
            log.info("Polling tasks from: {}", pollUrl);

            Request request = new Request.Builder()
                    .url(pollUrl)
                    .get()
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body() != null ? response.body().string() : "";
                    TaskDispatchResponse taskResponse = objectMapper.readValue(
                            responseBody, TaskDispatchResponse.class);

                    if (taskResponse.getTasks() != null && !taskResponse.getTasks().isEmpty()) {
                        log.info("Received {} tasks", taskResponse.getTasks().size());

                        // 处理每个任务, 每个任务异步处理
                        for (TaskDispatchItem task : taskResponse.getTasks()) {
                            processTask(task);
                        }
                        return PollOutcome.TASKS_PROCESSED;
                    }
                    log.debug("No pending tasks");
                    return PollOutcome.NO_TASKS;
                } else {
                    log.warn("Failed to poll tasks, status: {}", response.code());
                    return PollOutcome.ERROR_NON_TIMEOUT;
                }
            }
        } catch (SocketTimeoutException e) {
            log.info("next polling tasks");
            return PollOutcome.TIMEOUT;
        } catch (Exception e) {
            log.error("Error polling tasks", e);
            return PollOutcome.ERROR_NON_TIMEOUT;
        }
    }

    /**
     * 处理任务
     */
    private void processTask(TaskDispatchItem task) {
        log.info("Processing task: {} ({})", task.getTaskId(), task.getTaskType());

        agentTaskExecutor.executeAsync(task, result -> {
            try {
                submitResultAsync(task, result);
            } catch (Exception ex) {
                log.error("Failed to submit task result asynchronously: {}", task.getTaskId(), ex);
            }
        });
    }

    /**
     * 提交任务结果
     */
    private void submitResultAsync(TaskDispatchItem task, TaskExecutionResult result) {
        final int maxRetries = 10;
        final ObjectMapper objectMapper = CommonUtils.getObjectMapper();

        Runnable submitJob = new Runnable() {
            int retry = 0;

            @Override
            public void run() {
                try {
                    TaskResultSubmitRequest req = new TaskResultSubmitRequest();
                    req.setRecordId(task.getRecordId());
                    req.setAgentInstanceId(agentConfig.getAgentInstanceId());
                    req.setStatus(result.getStatus());
                    req.setResultCode(result.getResultCode());
                    req.setResultMessage(result.getResultMessage());
                    req.setResultData(result.getResultData());
                    req.setErrorMessage(result.getErrorMessage());
                    req.setStartTime(formatTime(result.getStartTime()));
                    req.setEndTime(formatTime(result.getEndTime()));
                    req.setDurationMs(result.getDurationMs());

                    String json = objectMapper.writeValueAsString(req);
                    okhttp3.HttpUrl url = okhttp3.HttpUrl.parse(agentConfig.getServerUrl() + "/api/open/instances/tasks/result");
                    log.info("Sending task result to {}: {}", url, json);

                    RequestBody body = RequestBody.create(JSON, json);
                    Request httpRequest = new Request.Builder().url(url).post(body).build();

                    try (Response response = httpClient.newCall(httpRequest).execute()) {
                        if (response.isSuccessful()) {
                            log.info("Task result submitted successfully: {}", task.getTaskId());
                            return;
                        }
                        log.warn("Failed to submit task result, status: {}, attempt: {}", response.code(), retry + 1);
                    }
                } catch (Exception e) {
                    log.error("Error submitting task result, attempt: {}", retry + 1, e);
                }

                retry++;
                if (retry < maxRetries) {
                    long delay = (long) Math.pow(2, Math.min(retry - 1, 4)) * 1000L; // 1,2,4,8,16s
                    resultScheduler.schedule(this, delay, TimeUnit.MILLISECONDS);
                } else {
                    log.error("Failed to submit task result after {} attempts: {}", maxRetries, task.getTaskId());
                }
            }
        };

        resultScheduler.execute(submitJob);
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

    private void safeSleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private enum PollOutcome {
        TIMEOUT,
        TASKS_PROCESSED,
        NO_TASKS,
        DISABLED,
        ERROR_NON_TIMEOUT
    }
}
