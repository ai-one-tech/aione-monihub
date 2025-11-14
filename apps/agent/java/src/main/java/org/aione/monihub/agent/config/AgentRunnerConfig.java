package org.aione.monihub.agent.config;

import org.aione.monihub.agent.service.InstanceReportService;
import org.aione.monihub.agent.service.InstanceTaskService;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Agent Runner配置类
 */
@Configuration
public class AgentRunnerConfig {

    /**
     * 应用启动后自动启动Agent服务
     */
    @Bean
    public ApplicationRunner agentRunner(InstanceReportService reportService,
                                         InstanceTaskService taskService) {
        return args -> {
            AgentLogger log = AgentLoggerFactory.getLogger(AgentRunnerConfig.class);
            log.info("Starting AiOne MoniHub Agent...");

            // 启动上报服务
            reportService.start();

            // 启动任务服务
            taskService.start();

            log.info("Agent started successfully");

            // 注册关闭钩子
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                log.info("Shutting down Agent...");
                reportService.stop();
                taskService.stop();
                log.info("Agent stopped");
            }));
        };
    }
}