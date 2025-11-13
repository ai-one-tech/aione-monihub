package org.aione.monihub.agent.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 实例信息上报请求模型
 */
@Data
public class InstanceReportRequest {

    @JsonProperty("instance_id")
    private String instanceId;

    @JsonProperty("application_code")
    private String applicationCode;

    @JsonProperty("agent_type")
    private String agentType;

    @JsonProperty("agent_version")
    private String agentVersion;

    @JsonProperty("program_path")
    private String programPath;

    @JsonProperty("profiles")
    private String profiles;

    @JsonProperty("environment")
    private Map<String, Object> environment;

    @JsonProperty("system_info")
    private SystemInfo systemInfo;

    @JsonProperty("network_info")
    private NetworkInfo networkInfo;

    @JsonProperty("hardware_info")
    private HardwareInfo hardwareInfo;

    @JsonProperty("runtime_info")
    private RuntimeInfo runtimeInfo;

    @JsonProperty("custom_fields")
    private Map<String, Object> customFields;

    @JsonProperty("custom_metrics")
    private Map<String, Object> customMetrics;

    @JsonProperty("report_timestamp")
    private String reportTimestamp;

    @JsonProperty("agent_logs")
    private List<AgentLogItem> agentLogs;



    @Data
    public static class SystemInfo {
        @JsonProperty("os_type")
        private String osType;

        @JsonProperty("os_version")
        private String osVersion;

        @JsonProperty("hostname")
        private String hostname;
    }

    @Data
    public static class NetworkInfo {
        @JsonProperty("ip_address")
        private String ipAddress;

        @JsonProperty("public_ip")
        private String publicIp;

        @JsonProperty("mac_address")
        private String macAddress;

        @JsonProperty("network_type")
        private String networkType;

        @JsonProperty("port")
        private Integer port;

    }

    @Data
    public static class HardwareInfo {
        @JsonProperty("cpu_model")
        private String cpuModel;

        @JsonProperty("cpu_cores")
        private Integer cpuCores;

        @JsonProperty("cpu_usage_percent")
        private Double cpuUsagePercent;

        @JsonProperty("memory_total_mb")
        private Long memoryTotalMb;

        @JsonProperty("memory_used_mb")
        private Long memoryUsedMb;

        @JsonProperty("memory_usage_percent")
        private Double memoryUsagePercent;

        @JsonProperty("disk_total_gb")
        private Long diskTotalGb;

        @JsonProperty("disk_used_gb")
        private Long diskUsedGb;

        @JsonProperty("disk_usage_percent")
        private Double diskUsagePercent;
    }

    @Data
    public static class RuntimeInfo {
        @JsonProperty("process_id")
        private Integer processId;

        @JsonProperty("process_uptime_seconds")
        private Long processUptimeSeconds;

        @JsonProperty("thread_count")
        private Integer threadCount;
    }
}
