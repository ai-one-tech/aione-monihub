package tech.aione.monihub.agent.collector;

import lombok.extern.slf4j.Slf4j;

import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.util.HashMap;
import java.util.Map;

/**
 * 运行时信息采集器
 * 采集进程ID、运行时长、线程数等信息
 */
@Slf4j
public class RuntimeInfoCollector {
    
    private final RuntimeMXBean runtimeMXBean;
    private final ThreadMXBean threadMXBean;
    
    public RuntimeInfoCollector() {
        this.runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        this.threadMXBean = ManagementFactory.getThreadMXBean();
    }
    
    /**
     * 采集运行时信息
     * @return 运行时信息Map
     */
    public Map<String, Object> collect() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            info.put("process_id", getProcessId());
            info.put("process_uptime_seconds", getProcessUptimeSeconds());
            info.put("thread_count", getThreadCount());
        } catch (Exception e) {
            log.error("Failed to collect runtime info", e);
        }
        
        return info;
    }
    
    /**
     * 获取进程ID
     */
    private int getProcessId() {
        // RuntimeMXBean.getName() 返回格式通常是 "pid@hostname"
        String name = runtimeMXBean.getName();
        try {
            return Integer.parseInt(name.split("@")[0]);
        } catch (Exception e) {
            log.warn("Failed to parse process ID from: {}", name);
            return -1;
        }
    }
    
    /**
     * 获取进程运行时长（秒）
     */
    private long getProcessUptimeSeconds() {
        return runtimeMXBean.getUptime() / 1000;
    }
    
    /**
     * 获取线程数
     */
    private int getThreadCount() {
        return threadMXBean.getThreadCount();
    }
}
