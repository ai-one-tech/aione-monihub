package org.aione.monihub.agent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import okhttp3.OkHttpClient;
import org.aione.monihub.agent.collector.HardwareInfoCollector;
import org.aione.monihub.agent.collector.NetworkInfoCollector;
import org.aione.monihub.agent.collector.RuntimeInfoCollector;
import org.aione.monihub.agent.collector.SystemInfoCollector;
import org.aione.monihub.agent.executor.TaskExecutor;
import org.aione.monihub.agent.handler.ExecuteCommandHandler;
import org.aione.monihub.agent.service.InstanceReportService;
import org.aione.monihub.agent.service.InstanceTaskService;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.util.SpringContextUtils;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Agent自动配置类
 */
@Configuration
@EnableConfigurationProperties(AgentConfig.class)
public class AgentAutoConfiguration {

    /**
     * 配置OkHttpClient
     */
    @Bean
    public OkHttpClient okHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                .build();
    }

    /**
     * 配置ObjectMapper
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    /**
     * 系统信息采集器
     */
    @Bean
    public SystemInfoCollector systemInfoCollector() {
        return new SystemInfoCollector();
    }

    /**
     * 网络信息采集器
     */
    @Bean
    public NetworkInfoCollector networkInfoCollector() {
        return new NetworkInfoCollector();
    }

    /**
     * 硬件信息采集器
     */
    @Bean
    public HardwareInfoCollector hardwareInfoCollector() {
        return new HardwareInfoCollector();
    }

    /**
     * 运行时信息采集器
     */
    @Bean
    public RuntimeInfoCollector runtimeInfoCollector() {
        return new RuntimeInfoCollector();
    }

    /**
     * 实例上报服务
     */
    @Bean
    public InstanceReportService instanceReportService() {
        return new InstanceReportService();
    }

    /**
     * 实例任务服务
     */
    @Bean
    public InstanceTaskService instanceTaskService() {
        return new InstanceTaskService();
    }

    /**
     * 任务执行器
     */
    @Bean(name = "agentTaskExecutor")
    public TaskExecutor taskExecutor() {
        return new TaskExecutor();
    }

    /**
     * 命令执行处理器
     */
    @Bean
    public ExecuteCommandHandler executeCommandHandler() {
        return new ExecuteCommandHandler();
    }

    /**
     * Agent日志工厂
     */
    @Bean
    public AgentLoggerFactory agentLoggerFactory() {
        return new AgentLoggerFactory();
    }

    /**
     * Spring上下文工具类
     */
    @Bean
    public SpringContextUtils springContextUtils() {
        return new SpringContextUtils();
    }
}