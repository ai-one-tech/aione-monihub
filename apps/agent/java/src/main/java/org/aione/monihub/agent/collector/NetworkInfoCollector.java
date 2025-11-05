package org.aione.monihub.agent.collector;

import org.aione.monihub.agent.config.AgentProperties;
import org.aione.monihub.agent.util.AgentLogger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.net.*;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * 网络信息采集器
 * 采集IP地址、MAC地址、网络类型等信息
 */
@Component
public class NetworkInfoCollector {
    
    private AgentLogger log;
    
    @javax.annotation.Resource
    private OkHttpClient httpClient;
    
    @javax.annotation.Resource
    private AgentProperties properties;
    
    @javax.annotation.PostConstruct
    public void init() {
        this.log = new AgentLogger(LoggerFactory.getLogger(NetworkInfoCollector.class), properties);
    }
    
    private String cachedPublicIp;
    private long lastPublicIpFetchTime = 0;
    private static final long PUBLIC_IP_CACHE_DURATION = 3600_000; // 1小时
    
    /**
     * 采集网络信息
     * @return 网络信息Map
     */
    public Map<String, Object> collect() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            info.put("ip_address", getLocalIpAddress());
            info.put("public_ip", getPublicIp());
            info.put("mac_address", getMacAddress());
            info.put("network_type", getNetworkType());
        } catch (Exception e) {
            log.error("Failed to collect network info", e);
        }
        
        return info;
    }
    
    /**
     * 获取本地IP地址（非回环地址）
     */
    private String getLocalIpAddress() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                
                // 跳过回环和未激活的接口
                if (ni.isLoopback() || !ni.isUp()) {
                    continue;
                }
                
                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    
                    // 只返回IPv4地址
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get local IP address", e);
        }
        
        return "127.0.0.1";
    }
    
    /**
     * 获取公网IP地址（使用缓存机制）
     */
    private String getPublicIp() {
        long currentTime = System.currentTimeMillis();
        
        // 如果缓存未过期，直接返回
        if (cachedPublicIp != null && (currentTime - lastPublicIpFetchTime) < PUBLIC_IP_CACHE_DURATION) {
            return cachedPublicIp;
        }
        
        // 尝试从多个服务获取
        String[] services = {
            "https://ifconfig.me/ip",
            "https://icanhazip.com"
        };
        
        for (String service : services) {
            try {
                Request request = new Request.Builder()
                    .url(service)
                    .build();
                
                try (Response response = httpClient.newCall(request).execute()) {
                    if (response.isSuccessful() && response.body() != null) {
                        String publicIp = response.body().string().trim();
                        cachedPublicIp = publicIp;
                        lastPublicIpFetchTime = currentTime;
                        return publicIp;
                    }
                }
            } catch (Exception e) {
                log.debug("Failed to get public IP from {}", service);
            }
        }
        
        log.warn("Failed to get public IP from all services");
        return null;
    }
    
    /**
     * 获取MAC地址
     */
    private String getMacAddress() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                
                // 跳过回环和未激活的接口
                if (ni.isLoopback() || !ni.isUp()) {
                    continue;
                }
                
                byte[] mac = ni.getHardwareAddress();
                if (mac != null && mac.length > 0) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < mac.length; i++) {
                        sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? ":" : ""));
                    }
                    return sb.toString();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get MAC address", e);
        }
        
        return null;
    }
    
    /**
     * 获取网络类型（基于接口名称推测）
     */
    private String getNetworkType() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                
                if (ni.isLoopback() || !ni.isUp()) {
                    continue;
                }
                
                String name = ni.getName().toLowerCase();
                
                // 根据接口名称判断网络类型
                if (name.contains("eth") || name.contains("en")) {
                    return "wired"; // 有线网络
                } else if (name.contains("wlan") || name.contains("wifi") || name.contains("wlp")) {
                    return "wifi"; // 无线网络
                } else if (name.contains("ppp") || name.contains("wwan")) {
                    return "mobile"; // 移动网络
                }
            }
        } catch (Exception e) {
            log.warn("Failed to determine network type", e);
        }
        
        return "wired"; // 默认为有线
    }
}
