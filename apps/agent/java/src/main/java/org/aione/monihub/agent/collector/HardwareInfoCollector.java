package org.aione.monihub.agent.collector;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import oshi.SystemInfo;
import oshi.hardware.*;
import oshi.software.os.OSFileStore;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 硅件信息采集器
 * 采集CPU、内存、约盘使用情况
 */
@Slf4j
@Component
public class HardwareInfoCollector {
    
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hardware;
    private final GlobalMemory memory;
    private final CentralProcessor processor;
    
    public HardwareInfoCollector() {
        this.systemInfo = new SystemInfo();
        this.hardware = systemInfo.getHardware();
        this.memory = hardware.getMemory();
        this.processor = hardware.getProcessor();
    }
    
    /**
     * 采集硬件信息
     * @return 硬件信息Map
     */
    public Map<String, Object> collect() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            // CPU信息
            info.put("cpu_model", getCpuModel());
            info.put("cpu_cores", getCpuCores());
            info.put("cpu_usage_percent", getCpuUsage());
            
            // 内存信息
            info.put("memory_total_mb", getMemoryTotalMb());
            info.put("memory_used_mb", getMemoryUsedMb());
            info.put("memory_usage_percent", getMemoryUsagePercent());
            
            // 磁盘信息
            info.put("disk_total_gb", getDiskTotalGb());
            info.put("disk_used_gb", getDiskUsedGb());
            info.put("disk_usage_percent", getDiskUsagePercent());
            
        } catch (Exception e) {
            log.error("Failed to collect hardware info", e);
        }
        
        return info;
    }
    
    /**
     * 获取CPU型号
     */
    private String getCpuModel() {
        return processor.getProcessorIdentifier().getName();
    }
    
    /**
     * 获取CPU核心数
     */
    private int getCpuCores() {
        return processor.getLogicalProcessorCount();
    }
    
    /**
     * 获取CPU使用率
     */
    private double getCpuUsage() {
        // 需要两次采样计算使用率
        long[] prevTicks = processor.getSystemCpuLoadTicks();
        try {
            Thread.sleep(1000); // 等待1秒
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        double cpuUsage = processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100;
        return Math.round(cpuUsage * 100.0) / 100.0; // 保留两位小数
    }
    
    /**
     * 获取总内存（MB）
     */
    private long getMemoryTotalMb() {
        return memory.getTotal() / 1024 / 1024;
    }
    
    /**
     * 获取已用内存（MB）
     */
    private long getMemoryUsedMb() {
        return (memory.getTotal() - memory.getAvailable()) / 1024 / 1024;
    }
    
    /**
     * 获取内存使用率
     */
    private double getMemoryUsagePercent() {
        double usage = ((double) (memory.getTotal() - memory.getAvailable()) / memory.getTotal()) * 100;
        return Math.round(usage * 100.0) / 100.0;
    }
    
    /**
     * 获取总磁盘空间（GB）
     */
    private long getDiskTotalGb() {
        List<HWDiskStore> diskStores = hardware.getDiskStores();
        long totalSize = 0;
        
        for (HWDiskStore disk : diskStores) {
            totalSize += disk.getSize();
        }
        
        return totalSize / 1024 / 1024 / 1024;
    }
    
    /**
     * 获取已用磁盘空间（GB）
     */
    private long getDiskUsedGb() {
        // OSHI没有直接提供已用空间，需要通过文件系统计算
        List<OSFileStore> fileStores = systemInfo.getOperatingSystem().getFileSystem().getFileStores();
        long usedSize = 0;
        
        for (OSFileStore fs : fileStores) {
            usedSize += (fs.getTotalSpace() - fs.getUsableSpace());
        }
        
        return usedSize / 1024 / 1024 / 1024;
    }
    
    /**
     * 获取磁盘使用率
     */
    private double getDiskUsagePercent() {
        List<OSFileStore> fileStores = systemInfo.getOperatingSystem().getFileSystem().getFileStores();
        long totalSize = 0;
        long usedSize = 0;
        
        for (OSFileStore fs : fileStores) {
            totalSize += fs.getTotalSpace();
            usedSize += (fs.getTotalSpace() - fs.getUsableSpace());
        }
        
        if (totalSize == 0) {
            return 0.0;
        }
        
        double usage = ((double) usedSize / totalSize) * 100;
        return Math.round(usage * 100.0) / 100.0;
    }
}
