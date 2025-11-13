package org.aione.monihub.agent.config;

import lombok.Data;
import org.aione.monihub.agent.util.LocalConfigUtil;
import org.apache.logging.log4j.util.Strings;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.UUID;

/**
 * Agent配置属性
 */
@Data
@ConfigurationProperties(prefix = "monihub.agent")
public class AgentConfig {

    /**
     * 实例ID
     */
    private String instanceId;

    public String getInstanceId() {
        if (Strings.isEmpty(instanceId)) {
            // 读取本地文件的实例ID
            LocalConfig config = LocalConfigUtil.getConfig();
            if (config != null && Strings.isNotEmpty(config.getInstanceId())) {
                instanceId = config.getInstanceId();
            }

            if (Strings.isEmpty(instanceId)) {
                UUID uuid = UUID.randomUUID();
                instanceId = uuid.toString();
                LocalConfigUtil.updateConfig(new LocalConfig().setInstanceId(instanceId));
            }
        }
         return instanceId;
    }

    /**
     * 应用编码
     */
    private String applicationCode;

    /**
     * 服务端URL
     */
    private String serverUrl = "http://localhost:9080";

    /**
     * Agent类型
     */
    private String agentType = "java";

    /**
     * Agent版本
     */
    private String agentVersion = "1.0.0";

    /**
     * 上报配置
     */
    private ReportConfig report = new ReportConfig();

    /**
     * 任务配置
     */
    private TaskConfig task = new TaskConfig();

    /**
     * Debug模式开关，默认关闭
     */
    private boolean debug = false;


    @Data
    public static class ReportConfig {
        /**
         * 是否启用上报
         */
        private boolean enabled = true;

        /**
         * 上报间隔（秒）
         */
        private long intervalSeconds = 60;

        /**
         * 最大日志数
         */
        private int maxLogRetention = 1000;
    }

    @Data
    public static class TaskConfig {
        /**
         * 是否启用任务功能
         */
        private boolean enabled = true;

        /**
         * 任务拉取间隔（秒）
         */
        private long pollIntervalSeconds = 30;

        /**
         * 是否启用长轮询
         */
        private boolean longPollEnabled = true;

        /**
         * 长轮询超时（秒）
         */
        private int longPollTimeoutSeconds = 30;

        /**
         * 最大并发任务数
         */
        private int maxConcurrentTasks = 5;
    }

}
