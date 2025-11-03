package tech.aione.monihub.agent;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import tech.aione.monihub.agent.service.InstanceReportService;

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
    public ApplicationRunner agentRunner(InstanceReportService reportService) {
        return new ApplicationRunner() {
            @Override
            public void run(ApplicationArguments args) throws Exception {
                log.info("Starting AiOne MoniHub Agent...");
                
                // 启动上报服务
                reportService.start();
                
                log.info("Agent started successfully");
                
                // 注册关闭钩子
                Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                    log.info("Shutting down Agent...");
                    reportService.stop();
                    log.info("Agent stopped");
                }));
            }
        };
    }
}
