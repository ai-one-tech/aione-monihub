package tech.aione.monihub.agent.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Agent配置属性
 */
@Data
@ConfigurationProperties(prefix = "monihub.agent")
public class AgentProperties {
    
    /**
     * 实例ID
     */
    private String instanceId;
    
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
     * 文件配置
     */
    private FileConfig file = new FileConfig();
    
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
    
    @Data
    public static class FileConfig {
        /**
         * 上传目录
         */
        private String uploadDir = "/tmp/monihub/uploads";
        
        /**
         * 最大上传大小（MB）
         */
        private int maxUploadSizeMb = 100;
    }
}
