package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

/**
 * 任务结果提交请求模型
 * 对应后端 TaskResultSubmitRequest 模型
 * <p>
 * 用于向服务端回传任务执行结果
 */
@Data
public class TaskResultSubmitRequest {

    /**
     * 任务记录ID
     */
    @JsonProperty("record_id")
    private String recordId;

    /**
     * 实例ID
     */
    @JsonProperty("agent_instance_id")
    private String agentInstanceId;

    /**
     * 任务执行状态 (pending, dispatched, running, success, failed, timeout, cancelled)
     */
    @JsonProperty("status")
    private TaskStatus status;

    /**
     * 结果代码
     */
    @JsonProperty("result_code")
    private Integer resultCode;

    /**
     * 结果消息
     */
    @JsonProperty("result_message")
    private String resultMessage;

    /**
     * 结果数据
     */
    @JsonProperty("result_data")
    private Map<String, Object> resultData;

    /**
     * 错误消息
     */
    @JsonProperty("error_message")
    private String errorMessage;

    /**
     * 开始时间 (ISO 8601格式)
     */
    @JsonProperty("start_time")
    private String startTime;

    /**
     * 结束时间 (ISO 8601格式)
     */
    @JsonProperty("end_time")
    private String endTime;

    /**
     * 执行时长(毫秒)
     */
    @JsonProperty("duration_ms")
    private Long durationMs;
}