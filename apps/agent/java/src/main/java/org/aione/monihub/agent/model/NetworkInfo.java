package org.aione.monihub.agent.model;

import lombok.Data;

/**
 * 网络信息模型
 */
@Data
public class NetworkInfo {
    /**
     * IP地址
     */
    private String ipAddress;

    /**
     * 公网IP
     */
    private String publicIp;

    /**
     * MAC地址
     */
    private String macAddress;

    /**
     * 网络类型
     */
    private String networkType;

    /**
     * 端口
     */
    private Integer port;
}