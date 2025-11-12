package org.aione.monihub.agent.util;

import lombok.extern.slf4j.Slf4j;
import org.aione.monihub.agent.config.AgentConfig;
import org.slf4j.Logger;

/**
 * Agent日志工具类
 * 根据debug开关控制日志输出
 */
@Slf4j
public class AgentLogger {

    private final Logger logger;
    private final AgentConfig properties;

    public AgentLogger(Logger logger, AgentConfig properties) {
        this.logger = logger;
        this.properties = properties;
    }

    /**
     * DEBUG级别日志 - 仅在debug=true时输出
     */
    public void debug(String msg) {
        if (properties.isDebug()) {
            logger.debug(msg);
        }
    }

    public void debug(String format, Object arg) {
        if (properties.isDebug()) {
            logger.debug(format, arg);
        }
    }

    public void debug(String format, Object arg1, Object arg2) {
        if (properties.isDebug()) {
            logger.debug(format, arg1, arg2);
        }
    }

    public void debug(String format, Object... arguments) {
        if (properties.isDebug()) {
            logger.debug(format, arguments);
        }
    }

    /**
     * INFO级别日志 - 仅在debug=true时输出
     */
    public void info(String msg) {
        if (properties.isDebug()) {
            logger.info(msg);
        }
    }

    public void info(String format, Object arg) {
        if (properties.isDebug()) {
            logger.info(format, arg);
        }
    }

    public void info(String format, Object arg1, Object arg2) {
        if (properties.isDebug()) {
            logger.info(format, arg1, arg2);
        }
    }

    public void info(String format, Object... arguments) {
        if (properties.isDebug()) {
            logger.info(format, arguments);
        }
    }

    /**
     * WARN级别日志 - 始终输出
     */
    public void warn(String msg) {
        logger.warn(msg);
    }

    public void warn(String format, Object arg) {
        logger.warn(format, arg);
    }

    public void warn(String format, Object arg1, Object arg2) {
        logger.warn(format, arg1, arg2);
    }

    public void warn(String format, Object... arguments) {
        logger.warn(format, arguments);
    }

    public void warn(String msg, Throwable t) {
        logger.warn(msg, t);
    }

    /**
     * ERROR级别日志 - 始终输出
     */
    public void error(String msg) {
        logger.error(msg);
    }

    public void error(String format, Object arg) {
        if (properties.isDebug()) {
            logger.error(format, arg);
        }
    }

    public void error(String format, Object arg1, Object arg2) {
        if (properties.isDebug()) {
            logger.error(format, arg1, arg2);
        }
    }

    public void error(String format, Object... arguments) {
        if (properties.isDebug()) {
            logger.error(format, arguments);
        }
    }

    public void error(String msg, Throwable t) {
        if (properties.isDebug()) {
            logger.error(msg, t);
        }
    }
}
