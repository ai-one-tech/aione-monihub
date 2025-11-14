package org.aione.monihub.agent.util;

import lombok.extern.slf4j.Slf4j;
import org.aione.monihub.agent.config.AgentConfig;
import org.slf4j.Logger;
import org.slf4j.helpers.MessageFormatter;
import org.springframework.boot.logging.LogLevel;

/**
 * Agent日志工具类
 * 根据debug开关控制日志输出
 */
@Slf4j
public class AgentLogger {

    private final Logger logger;
    private final AgentConfig agentConfig;

    public AgentLogger(Logger logger, AgentConfig agentConfig) {
        this.logger = logger;
        this.agentConfig = agentConfig;
    }

    /**
     * DEBUG级别日志 - 仅在debug=true时输出
     */
    public void debug(String msg) {
        if (agentConfig.isDebug()) {
            logger.debug(msg);
            AgentLogStore.getInstance().append(LogLevel.DEBUG, msg, null);
        }
    }

    public void debug(String format, Object arg) {
        if (agentConfig.isDebug()) {
            logger.debug(format, arg);
            String m = MessageFormatter.format(format, arg).getMessage();
            AgentLogStore.getInstance().append(LogLevel.DEBUG, m, null);
        }
    }

    public void debug(String format, Object arg1, Object arg2) {
        if (agentConfig.isDebug()) {
            logger.debug(format, arg1, arg2);
            String m = MessageFormatter.format(format, arg1, arg2).getMessage();
            AgentLogStore.getInstance().append(LogLevel.DEBUG, m, null);
        }
    }

    public void debug(String format, Object... arguments) {
        if (agentConfig.isDebug()) {
            logger.debug(format, arguments);
            String m = MessageFormatter.arrayFormat(format, arguments).getMessage();
            AgentLogStore.getInstance().append(LogLevel.DEBUG, m, null);
        }
    }

    /**
     * INFO级别日志 - 仅在debug=true时输出
     */
    public void info(String msg) {
        if (agentConfig.isDebug()) {
            logger.info(msg);
            AgentLogStore.getInstance().append(LogLevel.INFO, msg, null);
        }
    }

    public void info(String format, Object arg) {
        if (agentConfig.isDebug()) {
            logger.info(format, arg);
            String m = MessageFormatter.format(format, arg).getMessage();
            AgentLogStore.getInstance().append(LogLevel.INFO, m, null);
        }
    }

    public void info(String format, Object arg1, Object arg2) {
        if (agentConfig.isDebug()) {
            logger.info(format, arg1, arg2);
            String m = MessageFormatter.format(format, arg1, arg2).getMessage();
            AgentLogStore.getInstance().append(LogLevel.INFO, m, null);
        }
    }

    public void info(String format, Object... arguments) {
        if (agentConfig.isDebug()) {
            logger.info(format, arguments);
            String m = MessageFormatter.arrayFormat(format, arguments).getMessage();
            AgentLogStore.getInstance().append(LogLevel.INFO, m, null);
        }
    }

    /**
     * WARN级别日志 - 始终输出
     */
    public void warn(String msg) {
        logger.warn(msg);
        AgentLogStore.getInstance().append(LogLevel.WARN, msg, null);
    }

    public void warn(String format, Object arg) {
        logger.warn(format, arg);
        String m = MessageFormatter.format(format, arg).getMessage();
        AgentLogStore.getInstance().append(LogLevel.WARN, m, null);
    }

    public void warn(String format, Object arg1, Object arg2) {
        logger.warn(format, arg1, arg2);
        String m = MessageFormatter.format(format, arg1, arg2).getMessage();
        AgentLogStore.getInstance().append(LogLevel.WARN, m, null);
    }

    public void warn(String format, Object... arguments) {
        logger.warn(format, arguments);
        String m = MessageFormatter.arrayFormat(format, arguments).getMessage();
        AgentLogStore.getInstance().append(LogLevel.WARN, m, null);
    }

    public void warn(String msg, Throwable t) {
        logger.warn(msg, t);
        AgentLogStore.getInstance().append(LogLevel.WARN, msg, null);
    }

    /**
     * ERROR级别日志 - 始终输出
     */
    public void error(String msg) {
        logger.error(msg);
        AgentLogStore.getInstance().append(LogLevel.ERROR, msg, null);
    }

    public void error(String format, Object arg) {
        if (agentConfig.isDebug()) {
            logger.error(format, arg);
            String m = MessageFormatter.format(format, arg).getMessage();
            AgentLogStore.getInstance().append(LogLevel.ERROR, m, null);
        }
    }

    public void error(String format, Object arg1, Object arg2) {
        if (agentConfig.isDebug()) {
            logger.error(format, arg1, arg2);
            String m = MessageFormatter.format(format, arg1, arg2).getMessage();
            AgentLogStore.getInstance().append(LogLevel.ERROR, m, null);
        }
    }

    public void error(String format, Object... arguments) {
        if (agentConfig.isDebug()) {
            logger.error(format, arguments);
            String m = MessageFormatter.arrayFormat(format, arguments).getMessage();
            AgentLogStore.getInstance().append(LogLevel.ERROR, m, null);
        }
    }

    public void error(String msg, Throwable t) {
        if (agentConfig.isDebug()) {
            logger.error(msg, t);
            AgentLogStore.getInstance().append(LogLevel.ERROR, msg, null);
        }
    }
}
