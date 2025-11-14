package org.aione.monihub.agent.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class InstanceConfig {

    /**
     * Debug模式开关，默认关闭
     */
    private boolean debug = false;

    /**
     * 上报配置
     */
    private ReportConfig report = new ReportConfig();

    /**
     * 任务配置
     */
    private TaskConfig task = new TaskConfig();

    /**
     * HTTP配置
     */
    private HttpConfig http = new HttpConfig();

    @Data
    public static class HttpConfig {
        /**
         * 是否启用代理
         */
        @JsonProperty("proxy_enabled")
        private boolean proxyEnabled = false;
        /**
         * 代理地址
         */
        @JsonProperty("proxy_host")
        private String proxyHost;
        /**
         * 代理端口
         */
        @JsonProperty("proxy_port")
        private int proxyPort;
        /**
         * 代理用户名
         */
        @JsonProperty("proxy_username")
        private String proxyUsername;
        /**
         * 代理密码
         */
        @JsonProperty("proxy_password")
        private String proxyPassword;
    }

    @Data
    public static class ReportConfig {
        /**
         * 是否启用上报
         */
        private boolean enabled = true;

        /**
         * 上报间隔（秒）
         */
        @JsonProperty("interval_seconds")
        private long intervalSeconds = 60;

        /**
         * 最大日志数
         */
        @JsonProperty("max_log_retention")
        private int maxLogRetention = 1000;
    }

    @Data
    public static class TaskConfig {
        /**
         * 是否启用任务功能
         */
        private boolean enabled = true;

        /**
         * 长轮询超时（秒）
         */
        @JsonProperty("long_poll_timeout_seconds")
        private int longPollTimeoutSeconds = 30;

        public int getLongPollTimeoutSeconds() {
            return Math.max(longPollTimeoutSeconds, 10);
        }
    }

}
