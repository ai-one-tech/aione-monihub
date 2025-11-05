package org.aione.monihub.agent;

import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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
            
            @Override
            public void run(ApplicationArguments args) throws Exception {
                if (reportService.getProperties().isDebug()) {
                    log.info("Starting AiOne MoniHub Agent...");
                }
                
                // 启动上报服务
                reportService.start();
                
                // 启动任务服务
                taskService.start();
                
                if (reportService.getProperties().isDebug()) {
                    log.info("Agent started successfully");
                }
                
                // 注册关闭钩子
                Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                    if (reportService.getProperties().isDebug()) {
                        log.info("Shutting down Agent...");
                    }
                    reportService.stop();
                    taskService.stop();
                    if (reportService.getProperties().isDebug()) {
                        log.info("Agent stopped");
                    }
                }));
            }
        };
    }
}
