package org.aione.monihub.agent.collector;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import oshi.SystemInfo;
import oshi.software.os.OperatingSystem;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.Map;

/**
 * 系统信息采集器
 * 采集操作系统类型、版本、主机名等信息
 */
@Slf4j
@Component
public class SystemInfoCollector {
    
    private final SystemInfo systemInfo;
    private final OperatingSystem os;
    
    public SystemInfoCollector() {
        this.systemInfo = new SystemInfo();
        this.os = systemInfo.getOperatingSystem();
    }
    
    /**
     * 采集系统信息
     * @return 系统信息Map
     */
    public Map<String, Object> collect() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            info.put("os_type", getOsType());
            info.put("os_version", getOsVersion());
            info.put("hostname", getHostname());
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
            return "Windows";
        } else if (family.toLowerCase().contains("mac")) {
            return "macOS";
        } else if (family.toLowerCase().contains("linux")) {
            return "Linux";
        } else {
            return family;
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
