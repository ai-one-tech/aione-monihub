package org.aione.monihub.agent.collector;

import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import oshi.software.os.OperatingSystem;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * 系统信息采集器
 * 采集操作系统类型、版本、主机名等信息
 */
public class SystemInfoCollector {

    private AgentLogger log;
    @javax.annotation.Resource
    private AgentConfig properties;

    private final oshi.SystemInfo systemInfo;
    private final OperatingSystem os;

    @javax.annotation.PostConstruct
    public void init() {
        // 初始化日志
        this.log = AgentLoggerFactory.getLogger(SystemInfoCollector.class);
    }

    public SystemInfoCollector() {
        this.systemInfo = new oshi.SystemInfo();
        this.os = systemInfo.getOperatingSystem();
    }

    /**
     * 采集系统信息
     *
     * @return 系统信息
     */
    public org.aione.monihub.agent.model.SystemInfo collect() {
        org.aione.monihub.agent.model.SystemInfo info = new org.aione.monihub.agent.model.SystemInfo();

        try {
            info.setOsType(getOsType());
            info.setOsVersion(getOsVersion());
            info.setHostname(getHostname());
        } catch (Exception e) {
            log.error("Failed to collect system info", e);
        }

        return info;
    }

    /**
     * 获取操作系统类型
     */
    private String getOsType() {
        String family = os.getFamily();

        // 转换为标准类型
        if (family.toLowerCase().contains("windows")) {
            return "windows";
        } else if (family.toLowerCase().contains("mac")) {
            return "macos";
        } else if (family.toLowerCase().contains("linux")) {
            return "linux";
        } else {
            return "unknown";
        }
    }

    /**
     * 获取操作系统版本
     */
    private String getOsVersion() {
        return os.getVersionInfo().getVersion();
    }

    /**
     * 获取主机名
     */
    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            log.warn("Failed to get hostname", e);
            return "unknown";
        }
    }
}
