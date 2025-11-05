package org.aione.monihub.agent.model;

import lombok.Data;

/**
 * 硬件信息模型
 */
@Data
public class HardwareInfo {
    /**
     * CPU型号
     */
    private String cpuModel;

    /**
     * CPU核心数
     */
    private Integer cpuCores;

    /**
     * CPU使用率百分比
     */
    private Double cpuUsagePercent;

    /**
     * 总内存（MB）
     */
    private Long memoryTotalMb;

    /**
     * 已用内存（MB）
     */
    private Long memoryUsedMb;

    /**
     * 内存使用率百分比
     */
    private Double memoryUsagePercent;

    /**
     * 磁盘总空间（GB）
     */
    private Long diskTotalGb;

    /**
     * 磁盘已用空间（GB）
     */
    private Long diskUsedGb;

    /**
     * 磁盘使用率百分比
     */
    private Double diskUsagePercent;
}