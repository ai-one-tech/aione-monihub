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
    shell_exec("shell_exec"),

    /**
     * 执行代码
     */
    run_code("run_code"),

    /**
     * 文件管理任务
     */
    file_manager("file_manager"),

    /**
     * 自定义命令任务
     */
    custom_command("custom_command"),
    http_request("http_request");

    /**
     * -- GETTER --
     * 获取枚举值
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