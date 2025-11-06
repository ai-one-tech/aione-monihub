package org.aione.monihub.agent.model;

/**
 * 任务类型枚举
 */
public enum TaskType {
    
    /**
     * Shell脚本执行任务
     */
    SHELL_EXEC("shell_exec"),
    
    /**
     * 文件管理任务
     */
    FILE_MANAGER("file_manager"),
    
    /**
     * 命令执行任务
     */
    EXECUTE_COMMAND("execute_command");
    
    private final String value;
    
    TaskType(String value) {
        this.value = value;
    }
    
    /**
     * 获取枚举值
     */
    public String getValue() {
        return value;
    }
    
    /**
     * 根据字符串值获取对应的枚举
     */
    public static TaskType fromValue(String value) {
        for (TaskType type : TaskType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown task type: " + value);
    }
    
    /**
     * 检查是否为有效的任务类型
     */
    public static boolean isValid(String value) {
        for (TaskType type : TaskType.values()) {
            if (type.value.equals(value)) {
                return true;
            }
        }
        return false;
    }
}