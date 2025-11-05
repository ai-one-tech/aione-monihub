package org.aione.monihub.agent.collector;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.model.NetworkInfo;
import org.aione.monihub.agent.util.AgentLogger;
import org.apache.logging.log4j.util.Strings;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.LinkedList;

/**
 * 网络信息采集器
 * 采集IP地址、MAC地址、网络类型等信息
 */
public class NetworkInfoCollector {

    private AgentLogger log;

    @javax.annotation.Resource
    private OkHttpClient httpClient;

    @javax.annotation.Resource
    private AgentConfig agentConfig;

    @Value("${server.port:0}")
    private Integer port;

    /**
     * IP地址
     */
    private LinkedList<String> ipAddressList = new LinkedList<>();

    /**
     * 公网IP
     */
    private String publicIp;

    /**
     * MAC地址
     */
    private LinkedList<String> macAddressList = new LinkedList<>();

    /**
     * 网络类型
     */
    private LinkedList<String> networkTypeList = new LinkedList<>();

    @javax.annotation.PostConstruct
    public void init() {
        this.log = new AgentLogger(LoggerFactory.getLogger(NetworkInfoCollector.class), agentConfig);

        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();

                // 跳过回环和未激活的接口
                if (ni.isLoopback() || !ni.isUp()) {
                    continue;
                }

                String networkType = null;

                String name = ni.getName().toLowerCase();

                // 根据接口名称判断网络类型
                if (name.contains("eth") || name.contains("en")) {
                    networkType = "wired"; // 有线网络
                } else if (name.contains("wlan") || name.contains("wifi") || name.contains("wlp")) {
                    networkType = "wifi"; // 无线网络
                } else if (name.contains("ppp") || name.contains("wwan")) {
                    networkType = "mobile"; // 移动网络
                }
                if (networkType == null) {
                    continue;
                }
                networkTypeList.add(networkType);

                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();

                    // 只返回IPv4地址
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        ipAddressList.add(addr.getHostAddress());
                    }
                }

                byte[] mac = ni.getHardwareAddress();
                if (mac != null && mac.length > 0) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < mac.length; i++) {
                        sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? ":" : ""));
                    }
                    macAddressList.add(sb.toString());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get local IP address", e);
        }

        initPublicIp();
    }

    /**
     * 采集网络信息
     *
     * @return 网络信息
     */
    public NetworkInfo collect() {
        NetworkInfo info = new NetworkInfo();

        try {
            info.setIpAddress(Strings.join(ipAddressList, ','));
            info.setPublicIp(publicIp);
            info.setMacAddress(Strings.join(macAddressList, ','));
            info.setNetworkType(Strings.join(networkTypeList, ','));
            info.setPort(port);
        } catch (Exception e) {
            log.error("Failed to collect network info", e);
        }

        return info;
    }

    /**
     * 获取公网IP地址（使用缓存机制）
     */
    private void initPublicIp() {
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
                        publicIp = response.body().string().trim();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get public IP from {}", service);
            }
        }

    }

}
