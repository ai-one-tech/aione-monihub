package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum AgentLogLevel {
    @JsonProperty("trace")
    trace,
    @JsonProperty("debug")
    debug,
    @JsonProperty("info")
    info,
    @JsonProperty("warn")
    warn,
    @JsonProperty("error")
    error,
    @JsonProperty("fatal")
    fatal
}
