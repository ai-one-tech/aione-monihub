package org.aione.monihub.agent.model;

import lombok.Getter;

/**
 * 任务类型枚举
 */
@Getter
public enum TaskType {
    
    /**
     * Shell脚本执行任务
     */
    SHELL_EXEC("shell_exec"),
    
    /**
     * 文件管理任务
     */
    SCRIPT_EXEC("script_exec"),

    /**
     * 文件管理任务
     */
    FILE_MANAGER("file_manager"),
    
    /**
     * 自定义命令任务
     */
    CUSTOM_COMMAND("custom_command");

    /**
     * -- GETTER --
     *  获取枚举值
     */
    private final String value;
    
    TaskType(String value) {
        this.value = value;
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