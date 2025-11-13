package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

@Data
public class AgentLogItem {

    @JsonProperty("log_level")
    private AgentLogLevel logLevel;

    @JsonProperty("message")
    private String message;

    @JsonProperty("context")
    private Map<String, Object> context;

    @JsonProperty("timestamp")
    private String timestamp;

}
