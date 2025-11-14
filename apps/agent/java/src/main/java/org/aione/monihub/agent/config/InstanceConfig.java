package org.aione.monihub.agent.config;

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
        private boolean proxyEnabled = false;
        /**
         * 代理地址
         */
        private String proxyHost;
        /**
         * 代理端口
         */
        private int proxyPort;
        /**
         * 代理用户名
         */
        private String proxyUsername;
        /**
         * 代理密码
         */
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
         * 长轮询超时（秒）
         */
        private int longPollTimeoutSeconds = 30;

        public int getLongPollTimeoutSeconds() {
            return Math.max(longPollTimeoutSeconds, 10);
        }
    }

}
