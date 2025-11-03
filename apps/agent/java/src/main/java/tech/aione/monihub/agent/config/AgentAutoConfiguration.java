package tech.aione.monihub.agent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tech.aione.monihub.agent.service.InstanceReportService;

import java.util.concurrent.TimeUnit;

/**
 * Agent自动配置类
 */
@Slf4j
@Configuration
@EnableConfigurationProperties(AgentProperties.class)
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
     * 配置实例上报服务
     */
    @Bean
    @ConditionalOnProperty(prefix = "monihub.agent.report", name = "enabled", havingValue = "true", matchIfMissing = true)
    public InstanceReportService instanceReportService(
            AgentProperties properties,
            OkHttpClient httpClient,
            ObjectMapper objectMapper) {
        
        log.info("Initializing InstanceReportService");
        return new InstanceReportService(properties, httpClient, objectMapper);
    }
}
