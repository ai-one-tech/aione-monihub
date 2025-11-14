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
public class AgentConfig extends InstanceConfig {

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
    public String getAgentType() {
        return "java";
    }

    /**
     * Agent版本
     */
    public String getAgentVersion() {
        return "1.0.0";
    }

}
