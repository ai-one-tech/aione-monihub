package org.aione.monihub.agent;

import org.aione.monihub.agent.config.AgentProperties;
import org.aione.monihub.agent.util.AgentLogger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.aione.monihub.agent.service.InstanceReportService;
import org.aione.monihub.agent.service.InstanceTaskService;

import javax.annotation.Resource;

/**
 * Agent应用主类
 */
@SpringBootApplication
public class AgentApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(AgentApplication.class, args);
    }
    
    /**
     * 应用启动后自动启动Agent服务
     */
    @Bean
    public ApplicationRunner agentRunner() {
        return new ApplicationRunner() {
            
            @Resource
            private InstanceReportService reportService;
            
            @Resource
            private InstanceTaskService taskService;
            
            @Resource
            private AgentProperties properties;
            
            @Override
            public void run(ApplicationArguments args) throws Exception {
                AgentLogger log = new AgentLogger(LoggerFactory.getLogger(AgentApplication.class), properties);
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
            }
        };
    }
}
