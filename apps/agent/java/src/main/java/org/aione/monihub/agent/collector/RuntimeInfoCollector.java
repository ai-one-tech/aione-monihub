package org.aione.monihub.agent.collector;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.MapType;
import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.executor.TaskExecutor;
import org.aione.monihub.agent.model.RuntimeInfo;
import org.aione.monihub.agent.util.AgentLogger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.nio.file.Paths;
import java.util.*;

/**
 * 运行时信息采集器
 * 采集进程ID、运行时长、线程数等信息
 */
public class RuntimeInfoCollector {

    private AgentLogger log;

    @javax.annotation.Resource
    private AgentConfig agentConfig;

    @javax.annotation.Resource
    private ObjectMapper objectMapper;

    @Value("${spring.profiles.active:-}")
    private String profiles;

    private final RuntimeMXBean runtimeMXBean;
    private final ThreadMXBean threadMXBean;
    private final Map<String, Object> propertiesMap = new HashMap<>();

    @javax.annotation.PostConstruct
    public void init() {
        // 初始化日志
        this.log = new AgentLogger(LoggerFactory.getLogger(TaskExecutor.class), agentConfig);
    }

    public RuntimeInfoCollector() {
        this.runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        this.threadMXBean = ManagementFactory.getThreadMXBean();
        Properties properties = System.getProperties();
        List<String> keys = Arrays.asList("custom_metrics", "custom_fields");
        properties.forEach((key, value) -> {
            String string = String.valueOf(key);
            if (keys.contains(string)) {
                propertiesMap.put(string, value);
            }
        });
    }

    /**
     * 采集运行时信息
     *
     * @return 运行时信息
     */
    public RuntimeInfo collect() {
        RuntimeInfo info = new RuntimeInfo();

        try {
            info.setProcessId(getProcessId());
            info.setProcessUptimeSeconds(getProcessUptimeSeconds());
            info.setThreadCount(getThreadCount());
            info.setProgramPath(getProgramPath());
            info.setProfiles(profiles);
            info.setEnvironment(getEnvironment());
            info.setCustomFields(getCustomFields());
            info.setCustomMetrics(getCustomMetrics());
        } catch (Exception e) {
            log.error("Failed to collect runtime info", e);
        }

        return info;
    }

    /**
     * 获取进程ID
     */
    private int getProcessId() {
        // RuntimeMXBean.getName() 返回格式通常是 "pid@hostname"
        String name = runtimeMXBean.getName();
        try {
            return Integer.parseInt(name.split("@")[0]);
        } catch (Exception e) {
            log.warn("Failed to parse process ID from: {}", name);
            return -1;
        }
    }

    /**
     * 获取进程运行时长（秒）
     */
    private long getProcessUptimeSeconds() {
        return runtimeMXBean.getUptime() / 1000;
    }

    /**
     * 获取线程数
     */
    private int getThreadCount() {
        return threadMXBean.getThreadCount();
    }

    /**
     * 获取程序路径
     */
    private String getProgramPath() {
        try {
            String path = RuntimeInfo.class.getProtectionDomain().getCodeSource().getLocation().toURI().getPath();
            return Paths.get(path).toString();
        } catch (Exception e) {
            log.warn("Failed to get program path", e);
        }
        return null;
    }

    /**
     * 获取环境变量（可选，只返回关键的环境变量）
     */
    private Map<String, Object> getEnvironment() {
        try {
            Map<String, Object> env = new HashMap<>();
            // 获取所有操作系统环境变量
            env.putAll(System.getenv());
            List<String> keys = Arrays.asList("PATH");
            for (String key : keys) {
                env.remove(key);
            }
            return env;
        } catch (Exception e) {
            log.warn("Failed to get environment", e);
        }
        return null;
    }

    /**
     * 获取自定义字段（预留扩展）
     */
    private Map<String, Object> getCustomFields() {
        Map<String, Object> env = new HashMap<>();
        // 添加关键的Java系统属性
        String customFields = Optional.ofNullable(System.getProperty("custom_fields")).orElse("{}");
        try {
            MapType mapType = objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class);
            Map<String, Object> customFieldMap = objectMapper.readValue(customFields, mapType);
            if (customFieldMap != null) {
                env.putAll(customFieldMap);
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse custom fields", e);
        }
        return env;
    }

    /**
     * 获取自定义指标（预留扩展）
     */
    private Map<String, Object> getCustomMetrics() {

        Map<String, Object> env = new HashMap<>();
        // 添加关键的Java系统属性
        String customFields = Optional.ofNullable(System.getProperty("custom_metrics")).orElse("{}");
        try {
            env.putAll(propertiesMap);
            MapType mapType = objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class);
            Map<String, Object> customFieldMap = objectMapper.readValue(customFields, mapType);
            if (customFieldMap != null) {
                env.putAll(customFieldMap);
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse custom metrics", e);
        }
        return env;

    }
}
