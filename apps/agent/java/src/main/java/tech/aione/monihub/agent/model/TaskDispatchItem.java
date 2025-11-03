package tech.aione.monihub.agent.model;

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
    private String taskType;
    
    @JsonProperty("task_content")
    private Map<String, Object> taskContent;
    
    @JsonProperty("timeout_seconds")
    private Integer timeoutSeconds;
    
    @JsonProperty("priority")
    private Integer priority;
}
