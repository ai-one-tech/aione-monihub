package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

/**
 * 任务结果提交请求模型
 */
@Data
public class TaskResultSubmitRequest {

    @JsonProperty("record_id")
    private String recordId;

    @JsonProperty("instance_id")
    private String instanceId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("result_code")
    private Integer resultCode;

    @JsonProperty("result_message")
    private String resultMessage;

    @JsonProperty("result_data")
    private Map<String, Object> resultData;

    @JsonProperty("error_message")
    private String errorMessage;

    @JsonProperty("start_time")
    private String startTime;

    @JsonProperty("end_time")
    private String endTime;

    @JsonProperty("duration_ms")
    private Long durationMs;
}
