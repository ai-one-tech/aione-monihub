package org.aione.monihub.agent.util;

import org.aione.monihub.agent.config.AgentProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * AgentLogger工厂类
 * 用于创建带有debug控制的日志对象
 */
@Component
public class AgentLoggerFactory {
    
    private static AgentProperties staticProperties;
    
    @Resource
    private AgentProperties properties;
    
    @javax.annotation.PostConstruct
    public void init() {
        staticProperties = properties;
    }
    
    /**
     * 获取日志对象
     * @param clazz 类对象
     * @return AgentLogger实例
     */
    public static AgentLogger getLogger(Class<?> clazz) {
        Logger logger = LoggerFactory.getLogger(clazz);
        return new AgentLogger(logger, staticProperties);
    }
    
    /**
     * 获取日志对象
     * @param name 日志名称
     * @return AgentLogger实例
     */
    public static AgentLogger getLogger(String name) {
        Logger logger = LoggerFactory.getLogger(name);
        return new AgentLogger(logger, staticProperties);
    }
}
