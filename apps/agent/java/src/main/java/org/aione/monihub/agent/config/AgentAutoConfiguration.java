package org.aione.monihub.agent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import okhttp3.Credentials;
import okhttp3.OkHttpClient;
import org.aione.monihub.agent.collector.HardwareInfoCollector;
import org.aione.monihub.agent.collector.NetworkInfoCollector;
import org.aione.monihub.agent.collector.RuntimeInfoCollector;
import org.aione.monihub.agent.collector.SystemInfoCollector;
import org.aione.monihub.agent.executor.AgentTaskExecutor;
import org.aione.monihub.agent.filter.HttpDisabledFilter;
import org.aione.monihub.agent.handler.*;
import org.aione.monihub.agent.service.InstanceReportService;
import org.aione.monihub.agent.service.InstanceTaskService;
import org.aione.monihub.agent.util.SpringContextUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Agent自动配置类
 */
@Configuration
public class AgentAutoConfiguration {

    @Bean
    public SpringContextUtils springContextUtils() {
        return new SpringContextUtils();
    }

    @Bean
    public AgentConfig agentConfig() {
        return new AgentConfig();
    }

    /**
     * 配置OkHttpClient
     */
    @Bean
    public OkHttpClient okHttpClient(AgentConfig properties) {
        int longPollTimeout = properties.getTask() != null ? properties.getTask().getLongPollTimeoutSeconds() : 0;
        int readTimeout = longPollTimeout + 10;
        OkHttpClient.Builder b = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(readTimeout, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true);

        InstanceConfig.HttpConfig http = properties.getHttp();
        if (http != null && http.isProxyEnabled() && http.getProxyHost() != null && http.getProxyPort() > 0) {
            java.net.Proxy proxy = new java.net.Proxy(java.net.Proxy.Type.HTTP, new java.net.InetSocketAddress(http.getProxyHost(), http.getProxyPort()));
            b.proxy(proxy);
            if (http.getProxyUsername() != null && http.getProxyPassword() != null) {
                b.proxyAuthenticator((route, response) -> {
                    String credential = Credentials.basic(http.getProxyUsername(), http.getProxyPassword());
                    return response.request().newBuilder().header("Proxy-Authorization", credential).build();
                });
            }
        }
        return b.build();
    }

    @Bean
    public HttpDisabledFilter httpDisabledFilter() {
        return new HttpDisabledFilter();
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
    @Bean
    public AgentTaskExecutor agentTaskExecutor() {
        return new AgentTaskExecutor();
    }

    /**
     * 命令执行处理器
     */
    @Bean
    public CustomCommandHandler executeCommandHandler() {
        return new CustomCommandHandler();
    }

    /**
     * Shell脚本执行处理器
     */
    @Bean
    public ShellExecHandler shellExecHandler() {
        return new ShellExecHandler();
    }

    /**
     * 文件管理处理器
     */
    @Bean
    public FileManagerHandler fileManagerHandler() {
        return new FileManagerHandler();
    }

    /**
     * 文件管理处理器
     */
    @Bean
    public RunnerCodeHandler runnerCodeHandler() {
        return new RunnerCodeHandler();
    }

    @Bean
    public HttpRequestHandler httpRequestHandler() {
        return new HttpRequestHandler();
    }

}
