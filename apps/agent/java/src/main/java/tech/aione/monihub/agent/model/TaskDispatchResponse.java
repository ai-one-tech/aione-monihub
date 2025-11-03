package tech.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 任务下发响应模型
 */
@Data
public class TaskDispatchResponse {
    
    @JsonProperty("tasks")
    private List<TaskDispatchItem> tasks;
    
    @JsonProperty("timestamp")
    private Long timestamp;
}
