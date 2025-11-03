package tech.aione.monihub.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import tech.aione.monihub.agent.config.AgentProperties;
import tech.aione.monihub.agent.collector.*;
import tech.aione.monihub.agent.model.InstanceReportRequest;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 实例信息上报服务
 */
@Slf4j
public class InstanceReportService {
    
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private final AgentProperties properties;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService scheduler;
    
    private final SystemInfoCollector systemInfoCollector;
    private final NetworkInfoCollector networkInfoCollector;
    private final HardwareInfoCollector hardwareInfoCollector;
    private final RuntimeInfoCollector runtimeInfoCollector;
    
    private int failureCount = 0;
    private static final int MAX_FAILURES = 3;
    
    public InstanceReportService(AgentProperties properties, 
                                 OkHttpClient httpClient, 
                                 ObjectMapper objectMapper) {
        this.properties = properties;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread thread = new Thread(r, "instance-report-scheduler");
            thread.setDaemon(true);
            return thread;
        });
        
        // 初始化采集器
        this.systemInfoCollector = new SystemInfoCollector();
        this.networkInfoCollector = new NetworkInfoCollector(httpClient);
        this.hardwareInfoCollector = new HardwareInfoCollector();
        this.runtimeInfoCollector = new RuntimeInfoCollector();
    }
    
    /**
     * 启动定时上报
     */
    public void start() {
        if (!properties.getReport().isEnabled()) {
            log.info("Instance report is disabled");
            return;
        }
        
        long intervalSeconds = properties.getReport().getIntervalSeconds();
        log.info("Starting instance report service, interval: {} seconds", intervalSeconds);
        
        // 延迟10秒后开始首次上报，然后按固定间隔执行
        scheduler.scheduleAtFixedRate(
            this::reportInstance,
            10,
            intervalSeconds,
            TimeUnit.SECONDS
        );
    }
    
    /**
     * 停止定时上报
     */
    public void stop() {
        log.info("Stopping instance report service");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * 上报实例信息
     */
    private void reportInstance() {
        try {
            log.debug("Collecting instance information...");
            
            // 采集各类信息
            Map<String, Object> systemInfo = systemInfoCollector.collect();
            Map<String, Object> networkInfo = networkInfoCollector.collect();
            Map<String, Object> hardwareInfo = hardwareInfoCollector.collect();
            Map<String, Object> runtimeInfo = runtimeInfoCollector.collect();
            
            // 构建上报请求
            InstanceReportRequest request = buildReportRequest(
                systemInfo, networkInfo, hardwareInfo, runtimeInfo
            );
            
            // 发送上报请求
            boolean success = sendReport(request);
            
            if (success) {
                failureCount = 0;
                log.debug("Instance report sent successfully");
            } else {
                failureCount++;
                log.warn("Instance report failed, failure count: {}", failureCount);
                
                if (failureCount >= MAX_FAILURES) {
                    log.error("Instance report failed {} times consecutively", MAX_FAILURES);
                }
            }
            
        } catch (Exception e) {
            log.error("Error during instance report", e);
            failureCount++;
        }
    }
    
    /**
     * 构建上报请求
     */
    private InstanceReportRequest buildReportRequest(
            Map<String, Object> systemInfo,
            Map<String, Object> networkInfo,
            Map<String, Object> hardwareInfo,
            Map<String, Object> runtimeInfo) {
        
        InstanceReportRequest request = new InstanceReportRequest();
        request.setInstanceId(properties.getInstanceId());
        request.setAgentType(properties.getAgentType());
        request.setAgentVersion(properties.getAgentVersion());
        
        // 系统信息
        InstanceReportRequest.SystemInfo sysInfo = new InstanceReportRequest.SystemInfo();
        sysInfo.setOsType((String) systemInfo.get("os_type"));
        sysInfo.setOsVersion((String) systemInfo.get("os_version"));
        sysInfo.setHostname((String) systemInfo.get("hostname"));
        request.setSystemInfo(sysInfo);
        
        // 网络信息
        InstanceReportRequest.NetworkInfo netInfo = new InstanceReportRequest.NetworkInfo();
        netInfo.setIpAddress((String) networkInfo.get("ip_address"));
        netInfo.setPublicIp((String) networkInfo.get("public_ip"));
        netInfo.setMacAddress((String) networkInfo.get("mac_address"));
        netInfo.setNetworkType((String) networkInfo.get("network_type"));
        request.setNetworkInfo(netInfo);
        
        // 硬件信息
        InstanceReportRequest.HardwareInfo hwInfo = new InstanceReportRequest.HardwareInfo();
        hwInfo.setCpuModel((String) hardwareInfo.get("cpu_model"));
        hwInfo.setCpuCores((Integer) hardwareInfo.get("cpu_cores"));
        hwInfo.setCpuUsagePercent((Double) hardwareInfo.get("cpu_usage_percent"));
        hwInfo.setMemoryTotalMb((Long) hardwareInfo.get("memory_total_mb"));
        hwInfo.setMemoryUsedMb((Long) hardwareInfo.get("memory_used_mb"));
        hwInfo.setMemoryUsagePercent((Double) hardwareInfo.get("memory_usage_percent"));
        hwInfo.setDiskTotalGb((Long) hardwareInfo.get("disk_total_gb"));
        hwInfo.setDiskUsedGb((Long) hardwareInfo.get("disk_used_gb"));
        hwInfo.setDiskUsagePercent((Double) hardwareInfo.get("disk_usage_percent"));
        request.setHardwareInfo(hwInfo);
        
        // 运行时信息
        InstanceReportRequest.RuntimeInfo rtInfo = new InstanceReportRequest.RuntimeInfo();
        rtInfo.setProcessId((Integer) runtimeInfo.get("process_id"));
        rtInfo.setProcessUptimeSeconds((Long) runtimeInfo.get("process_uptime_seconds"));
        rtInfo.setThreadCount((Integer) runtimeInfo.get("thread_count"));
        request.setRuntimeInfo(rtInfo);
        
        // 上报时间（ISO 8601格式）
        request.setReportTimestamp(ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        
        return request;
    }
    
    /**
     * 发送上报请求
     */
    private boolean sendReport(InstanceReportRequest request) {
        try {
            String json = objectMapper.writeValueAsString(request);
            String url = properties.getServerUrl() + "/api/open/instances/report";
            
            RequestBody body = RequestBody.create(json, JSON);
            Request httpRequest = new Request.Builder()
                .url(url)
                .post(body)
                .build();
            
            try (Response response = httpClient.newCall(httpRequest).execute()) {
                if (response.isSuccessful()) {
                    log.trace("Report response: {}", response.body().string());
                    return true;
                } else {
                    log.warn("Report failed with status: {}", response.code());
                    return false;
                }
            }
            
        } catch (Exception e) {
            log.error("Error sending report", e);
            return false;
        }
    }
}
