package tech.aione.monihub.agent.model;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

/**
 * 任务执行结果模型
 */
@Data
@AllArgsConstructor
public class TaskResult {
    
    /**
     * 结果码，0表示成功
     */
    private Integer code;
    
    /**
     * 结果消息
     */
    private String message;
    
    /**
     * 结果数据
     */
    private Map<String, Object> data;
    
    public static TaskResult success(String message) {
        return new TaskResult(0, message, null);
    }
    
    public static TaskResult success(String message, Map<String, Object> data) {
        return new TaskResult(0, message, data);
    }
    
    public static TaskResult failure(String message) {
        return new TaskResult(1, message, null);
    }
    
    public static TaskResult failure(Integer code, String message) {
        return new TaskResult(code, message, null);
    }
}
