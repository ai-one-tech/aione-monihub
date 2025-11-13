package org.aione.monihub.agent.util;

import com.fasterxml.jackson.databind.JsonNode;
import org.aione.monihub.agent.config.AgentConfig;

public class AgentConfigOverrideApplier {
    public static void apply(AgentConfig properties, JsonNode cfg) {
        if (properties == null || cfg == null) return;

        if (cfg.has("debug") && cfg.get("debug").isBoolean()) {
            properties.setDebug(cfg.get("debug").asBoolean());
        }

        if (cfg.has("report") && cfg.get("report").isObject()) {
            JsonNode r = cfg.get("report");
            if (r.has("enabled") && r.get("enabled").isBoolean()) {
                properties.getReport().setEnabled(r.get("enabled").asBoolean());
            }
            if (r.has("intervalSeconds") && r.get("intervalSeconds").canConvertToLong()) {
                properties.getReport().setIntervalSeconds(r.get("intervalSeconds").asLong());
            }
            if (r.has("maxLogRetention") && r.get("maxLogRetention").canConvertToInt()) {
                properties.getReport().setMaxLogRetention(r.get("maxLogRetention").asInt());
            }
        }

        if (cfg.has("task") && cfg.get("task").isObject()) {
            JsonNode t = cfg.get("task");
            if (t.has("enabled") && t.get("enabled").isBoolean()) {
                properties.getTask().setEnabled(t.get("enabled").asBoolean());
            }
            if (t.has("pollIntervalSeconds") && t.get("pollIntervalSeconds").canConvertToLong()) {
                properties.getTask().setPollIntervalSeconds(t.get("pollIntervalSeconds").asLong());
            }
            if (t.has("longPollEnabled") && t.get("longPollEnabled").isBoolean()) {
                properties.getTask().setLongPollEnabled(t.get("longPollEnabled").asBoolean());
            }
            if (t.has("longPollTimeoutSeconds") && t.get("longPollTimeoutSeconds").canConvertToInt()) {
                properties.getTask().setLongPollTimeoutSeconds(t.get("longPollTimeoutSeconds").asInt());
            }
            if (t.has("maxConcurrentTasks") && t.get("maxConcurrentTasks").canConvertToInt()) {
                properties.getTask().setMaxConcurrentTasks(t.get("maxConcurrentTasks").asInt());
            }
        }

    }
}
