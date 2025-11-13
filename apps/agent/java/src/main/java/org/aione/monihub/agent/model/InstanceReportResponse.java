package org.aione.monihub.agent.model;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class InstanceReportResponse {
    private String status;
    private String message;
    private String recordId;
    private long timestamp;
    private Integer logSuccessCount;
    private Integer logFailureCount;
    private JsonNode agentConfig;
}

