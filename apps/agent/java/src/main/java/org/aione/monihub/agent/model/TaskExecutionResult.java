package org.aione.monihub.agent.model;


import lombok.experimental.Accessors;

import java.util.HashMap;
import java.util.Map;

/**
 * 任务执行结果
 */
@lombok.Data
@Accessors(chain = true)
public class TaskExecutionResult {
    private TaskStatus status;

    private Integer resultCode;
    private String resultMessage;
    private Map<String, Object> resultData = new HashMap<>();

    public static TaskExecutionResult failure(String errorMessage) {
        return new TaskExecutionResult().setStatus(TaskStatus.failed).setErrorMessage(errorMessage);
    }

    public static TaskExecutionResult success(Map<String, Object> resultData) {
        return new TaskExecutionResult().setStatus(TaskStatus.success).setResultData(resultData);
    }

    public static TaskExecutionResult success(String resultMessage, Map<String, Object> resultData) {
        return new TaskExecutionResult().setStatus(TaskStatus.success).setResultMessage(resultMessage).setResultData(resultData);
    }

    public static TaskExecutionResult success(String resultMessage) {
        return new TaskExecutionResult().setStatus(TaskStatus.success).setResultMessage(resultMessage);
    }

    public TaskExecutionResult put(String key, Object value) {
        if (resultData == null) {
            resultData = new HashMap<>();
        }
        resultData.put(key, value);
        return this;
    }

    private String errorMessage;

    private long startTime;
    private long endTime;
    private long durationMs;
}
