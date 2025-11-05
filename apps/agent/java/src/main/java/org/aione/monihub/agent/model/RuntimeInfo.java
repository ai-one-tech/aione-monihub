package org.aione.monihub.agent.model;

import lombok.Data;

import java.util.Map;

/**
 * 运行时信息模型
 */
@Data
public class RuntimeInfo {
    /**
     * 进程ID
     */
    private Integer processId;

    /**
     * 进程运行时长（秒）
     */
    private Long processUptimeSeconds;

    /**
     * 线程数
     */
    private Integer threadCount;

    /**
     * 程序路径
     */
    private String programPath;

    /**
     * 配置文件
     */
    private String profiles;

    /**
     * 环境变量
     */
    private Map<String, Object> environment;

    /**
     * 自定义字段
     */
    private Map<String, Object> customFields;

    /**
     * 自定义指标
     */
    private Map<String, Object> customMetrics;
}