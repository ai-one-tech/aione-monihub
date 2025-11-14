package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import org.aione.monihub.agent.config.InstanceConfig;

@Data
public class InstanceReportResponse {
    private String status;
    private String message;
    @JsonProperty("record_id")
    private String recordId;
    private long timestamp;
    @JsonProperty("log_success_count")
    private Integer logSuccessCount;
    @JsonProperty("log_failure_count")
    private Integer logFailureCount;
    private InstanceConfig config;
}

