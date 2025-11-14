package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.aione.monihub.agent.config.InstanceConfig;

@Data
public class InstanceReportResponse {
    /**
     * 状态
     */
    private String status;
    /**
     * 错误信息
     */
    private String message;
    /**
     * 记录ID
     */
    @JsonProperty("record_id")
    private String recordId;
    /**
     * 上报时间戳
     */
    private long timestamp;
    /**
     * 日志上报成功数
     */
    @JsonProperty("log_success_count")
    private Integer logSuccessCount;
    /**
     * 日志上报失败数
     */
    @JsonProperty("log_failure_count")
    private Integer logFailureCount;
    /**
     * 配置信息
     */
    private InstanceConfig config;
}

