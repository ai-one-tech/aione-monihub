package org.aione.monihub.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.aione.monihub.agent.collector.HardwareInfoCollector;
import org.aione.monihub.agent.collector.NetworkInfoCollector;
import org.aione.monihub.agent.collector.RuntimeInfoCollector;
import org.aione.monihub.agent.collector.SystemInfoCollector;
import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.config.InstanceConfig;
import org.aione.monihub.agent.model.*;
import org.aione.monihub.agent.util.AgentLogStore;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.springframework.http.HttpStatus;

import javax.annotation.Resource;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 实例信息上报服务
 */
@lombok.Data
public class InstanceReportService {

    private AgentLogger log;

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    @javax.annotation.Resource
    private AgentConfig agentConfig;

    @javax.annotation.Resource
    private OkHttpClient httpClient;

    @javax.annotation.Resource
    private ObjectMapper objectMapper;

    @javax.annotation.Resource
    private SystemInfoCollector systemInfoCollector;

    @javax.annotation.Resource
    private NetworkInfoCollector networkInfoCollector;

    @javax.annotation.Resource
    private HardwareInfoCollector hardwareInfoCollector;

    @javax.annotation.Resource
    private RuntimeInfoCollector runtimeInfoCollector;

    @Resource
    CustomCommandService customCommandService;

    private ScheduledExecutorService scheduler;

    private int failureCount = 0;
    private static final int MAX_FAILURES = 3;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(InstanceReportService.class);
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread thread = new Thread(r, "instance-report-scheduler");
            thread.setDaemon(true);
            return thread;
        });
    }

    /**
     * 启动定时上报
     */
    public void start() {
        long intervalSeconds = agentConfig.getReport().getIntervalSeconds();
        log.info("Starting instance report service, interval: {} seconds", intervalSeconds);

        // 延迟10秒后开始首次上报，然后按固定间隔执行
        scheduler.scheduleAtFixedRate(
                this::reportInstance,
                1,
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
            if (!agentConfig.getReport().isEnabled()) {
                log.info("Instance report is disabled");
                return;
            }
            
            // 构建上报请求
            InstanceReportRequest request = buildReportRequest();

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
    private InstanceReportRequest buildReportRequest() {

        // 采集各类信息
        SystemInfo systemInfo = systemInfoCollector.collect();
        NetworkInfo networkInfo = networkInfoCollector.collect();
        HardwareInfo hardwareInfo = hardwareInfoCollector.collect();
        RuntimeInfo runtimeInfo = runtimeInfoCollector.collect();

        InstanceReportRequest request = new InstanceReportRequest();
        request.setInstanceId(agentConfig.getInstanceId());
        request.setApplicationCode(agentConfig.getApplicationCode());
        request.setAgentType(agentConfig.getAgentType());
        request.setAgentVersion(agentConfig.getAgentVersion());

        // 程序路径
        request.setProgramPath(runtimeInfo.getProgramPath());
        request.setProfiles(runtimeInfo.getProfiles());

        // 环境变量
        request.setEnvironment(runtimeInfo.getEnvironment());

        // 系统信息
        InstanceReportRequest.SystemInfo sysInfo = new InstanceReportRequest.SystemInfo();
        sysInfo.setOsType(systemInfo.getOsType());
        sysInfo.setOsVersion(systemInfo.getOsVersion());
        sysInfo.setHostname(systemInfo.getHostname());
        request.setSystemInfo(sysInfo);

        // 网络信息
        InstanceReportRequest.NetworkInfo netInfo = new InstanceReportRequest.NetworkInfo();
        netInfo.setIpAddress(networkInfo.getIpAddress());
        netInfo.setPublicIp(networkInfo.getPublicIp());
        netInfo.setMacAddress(networkInfo.getMacAddress());
        netInfo.setNetworkType(networkInfo.getNetworkType());
        netInfo.setPort(networkInfo.getPort());
        request.setNetworkInfo(netInfo);

        // 硬件信息
        InstanceReportRequest.HardwareInfo hwInfo = new InstanceReportRequest.HardwareInfo();
        hwInfo.setCpuModel(hardwareInfo.getCpuModel());
        hwInfo.setCpuCores(hardwareInfo.getCpuCores());
        hwInfo.setCpuUsagePercent(hardwareInfo.getCpuUsagePercent());
        hwInfo.setMemoryTotalMb(hardwareInfo.getMemoryTotalMb());
        hwInfo.setMemoryUsedMb(hardwareInfo.getMemoryUsedMb());
        hwInfo.setMemoryUsagePercent(hardwareInfo.getMemoryUsagePercent());
        hwInfo.setDiskTotalGb(hardwareInfo.getDiskTotalGb());
        hwInfo.setDiskUsedGb(hardwareInfo.getDiskUsedGb());
        hwInfo.setDiskUsagePercent(hardwareInfo.getDiskUsagePercent());
        request.setHardwareInfo(hwInfo);

        // 运行时信息
        InstanceReportRequest.RuntimeInfo rtInfo = new InstanceReportRequest.RuntimeInfo();
        rtInfo.setProcessId(runtimeInfo.getProcessId());
        rtInfo.setProcessUptimeSeconds(runtimeInfo.getProcessUptimeSeconds());
        rtInfo.setThreadCount(runtimeInfo.getThreadCount());
        request.setRuntimeInfo(rtInfo);

        // 自定义字段和指标
        request.setCustomFields(runtimeInfo.getCustomFields());
        request.setCustomMetrics(runtimeInfo.getCustomMetrics());

        // 上报时间（ISO 8601格式）
        request.setReportTimestamp(ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        request.setAgentLogs(org.aione.monihub.agent.util.AgentLogStore.getInstance().snapshotPending());

        return request;
    }

    /**
     * 发送上报请求
     */
    private boolean sendReport(InstanceReportRequest request) {
        try {
            String json = objectMapper.writeValueAsString(request);
            String url = agentConfig.getServerUrl() + "/api/open/instances/report";
            log.info("Sending report request to {}: {}", url, json);

            int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                RequestBody body = RequestBody.create(JSON, json);
                Request.Builder builder = new Request.Builder().url(url).post(body);
                if (attempt > 1) {
                    builder.header("Connection", "close");
                }
                Request httpRequest = builder.build();

                try (Response response = httpClient.newCall(httpRequest).execute()) {
                    if (response.isSuccessful()) {
                        String respBody = response.body() != null ? response.body().string() : null;
                        if (respBody != null && !respBody.isEmpty()) {
                            InstanceReportResponse resp = objectMapper.readValue(respBody, InstanceReportResponse.class);
                            if (resp.getConfig() != null) {
                                InstanceConfig config = resp.getConfig();
                                agentConfig.setDebug(config.isDebug());
                                agentConfig.setTask(config.getTask());
                                agentConfig.setReport(config.getReport());
                            }
                        }

                        int sent = request.getAgentLogs() == null ? 0 : request.getAgentLogs().size();
                        AgentLogStore.getInstance().removeSent(sent);
                        return true;
                    } else {
                        if (response.code() == HttpStatus.FORBIDDEN.value()) {
                            customCommandService.process(CommandType.DisableHttp);
                            return false;
                        }
                        log.warn("Report failed with status: {}", response.code());
                        return false;
                    }
                } catch (Exception e) {
                    String msg = e.getMessage() == null ? "" : e.getMessage();
                    boolean retryable =
                            (e instanceof java.net.SocketException && (msg.contains("Broken pipe") || msg.contains("Connection reset")))
                                    || (e instanceof java.net.SocketTimeoutException);
                    if (retryable && attempt < maxRetries) {
                        log.warn("Retrying report due to error: {}, attempt: {}", msg, attempt);
                        continue;
                    }
                    log.error("Error sending report", e);
                    return false;
                }
            }
            return false;
        } catch (Exception outer) {
            log.error("Error sending report", outer);
            return false;
        }
    }
}
