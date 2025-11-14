package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

/**
 * 任务下发项模型
 */
@Data
public class TaskDispatchItem {

    @JsonProperty("task_id")
    private String taskId;

    @JsonProperty("record_id")
    private String recordId;

    @JsonProperty("task_type")
    private TaskType taskType;

    @JsonProperty("task_content")
    private Map<String, Object> taskContent;

    @JsonProperty("timeout_seconds")
    private Integer timeoutSeconds;

    public Integer getTimeoutSeconds() {
        if (timeoutSeconds == null || timeoutSeconds <= 0) {
            return 300; // 默认5分钟
        }
        return timeoutSeconds;
    }

    /**
     * 获取安全的超时时间
     *
     * @return
     */
    public Integer getSafeTimeoutSeconds() {
        Integer getTimeoutSeconds = getTimeoutSeconds();
        if (getTimeoutSeconds >= 10) {
            getTimeoutSeconds -= 5;
        }
        return getTimeoutSeconds;
    }

    @JsonProperty("priority")
    private Integer priority;
}
