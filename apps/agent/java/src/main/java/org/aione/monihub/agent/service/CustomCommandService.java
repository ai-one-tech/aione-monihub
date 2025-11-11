package org.aione.monihub.agent.service;

import org.aione.monihub.agent.AgentApplication;
import org.aione.monihub.agent.filter.HttpDisabledFilter;
import org.aione.monihub.agent.model.CommandType;
import org.aione.monihub.agent.util.SpringContextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;

@Service
public class CustomCommandService {

    @Autowired
    private HttpDisabledFilter httpDisabledFilter;

    public boolean process(CommandType command) {
        switch (command) {
            case Shutdown:
                return shutdown();
            case Restart:
                return restart();
            case DisableHttp:
                return disableHttp();
            case EnableHttp:
                return enableHttp();
            default:
                throw new IllegalArgumentException("Invalid command: " + command);
        }
    }

    public boolean shutdown() {
        try {
            // 通过SpringContextUtils获取应用上下文并关闭应用
            ConfigurableApplicationContext context =
                    (ConfigurableApplicationContext) SpringContextUtils.applicationContext;
            if (context.isActive()) {
                context.close();
            }
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to shutdown application: " + e.getMessage());
        }
    }

    public boolean restart() {
        try {
            // 在新线程中执行重启逻辑，避免阻塞当前请求处理
            new Thread(() -> {
                try {
                    // 通过SpringContextUtils获取应用上下文
                    ConfigurableApplicationContext context =
                            (ConfigurableApplicationContext) SpringContextUtils.applicationContext;
                    if (context.isActive()) {
                        // 关闭当前应用上下文
                        context.close();
                    }

                    // 获取应用主类并重新启动应用
                    SpringApplication app = new SpringApplication(AgentApplication.class);
                    ConfigurableApplicationContext newContext = app.run(new String[]{});
                } catch (Exception e) {
                    System.err.println("Failed to restart application: " + e.getMessage());
                }
            }).start();

            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to initiate restart: " + e.getMessage(), e);
        }
    }

    public boolean disableHttp() {
        try {
            // 调用过滤器禁用HTTP访问
            httpDisabledFilter.disableHttp();
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to disable HTTP access: " + e.getMessage(), e);
        }
    }

    /**
     * 启用HTTP访问（提供反向操作）
     *
     * @return 操作是否成功
     */
    public boolean enableHttp() {
        try {
            // 调用过滤器启用HTTP访问
            httpDisabledFilter.enableHttp();
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to enable HTTP access: " + e.getMessage(), e);
        }
    }
}
