package org.aione.monihub.agent.model;

import lombok.Data;

/**
 * 系统信息模型
 */
@Data
public class SystemInfo {
    /**
     * 操作系统类型
     */
    private String osType;

    /**
     * 操作系统版本
     */
    private String osVersion;

    /**
     * 主机名
     */
    private String hostname;
}