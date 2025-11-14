package org.aione.monihub.agent.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.util.CommonUtils;

import javax.annotation.PostConstruct;
import java.io.File;
import java.time.Duration;
import java.util.Map;
import java.util.Objects;

public class HttpRequestHandler implements TaskHandler {

    private AgentLogger log;

    @javax.annotation.Resource
    private OkHttpClient httpClient;

    @PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(HttpRequestHandler.class);
    }

    @Override
    public TaskExecutionResult execute(TaskDispatchItem task) throws Exception {
        ObjectMapper objectMapper = CommonUtils.getObjectMapper();
        Map<String, Object> content = task.getTaskContent();
        String method = str(content.get("method"), "GET");
        String url = str(content.get("url"), null);
        if (url == null || url.isEmpty()) {
            return TaskExecutionResult.failure("URL不能为空");
        }
        Boolean allowRedirects = bool(content.get("allow_redirects"), false);
        Integer timeoutSeconds = intv(content.get("timeout_seconds"), task.getTimeoutSeconds());
        String bodyType = str(content.get("body_type"), "none");
        Map<String, Object> headers = map(content.get("headers"));
        Map<String, Object> query = map(content.get("query"));

        HttpUrl.Builder ub = Objects.requireNonNull(HttpUrl.parse(url)).newBuilder();
        if (query != null) {
            for (Map.Entry<String, Object> e : query.entrySet()) {
                ub.addQueryParameter(e.getKey(), String.valueOf(e.getValue()));
            }
        }
        Request.Builder rb = new Request.Builder().url(ub.build());
        if (headers != null) {
            for (Map.Entry<String, Object> e : headers.entrySet()) {
                rb.header(e.getKey(), String.valueOf(e.getValue()));
            }
        }

        RequestBody reqBody = null;
        if ("json".equalsIgnoreCase(bodyType)) {
            Object jsonBody = content.get("json_body");
            byte[] data = objectMapper.writeValueAsBytes(jsonBody);
            reqBody = RequestBody.create(Objects.requireNonNull(MediaType.parse("application/json")), data);
        } else if ("form".equalsIgnoreCase(bodyType)) {
            FormBody.Builder fb = new FormBody.Builder();
            Map<String, Object> form = map(content.get("form_fields"));
            if (form != null) {
                for (Map.Entry<String, Object> e : form.entrySet()) {
                    fb.add(e.getKey(), String.valueOf(e.getValue()));
                }
            }
            reqBody = fb.build();
        } else if ("raw".equalsIgnoreCase(bodyType)) {
            String raw = str(content.get("raw_body"), "");
            String ct = str(content.get("content_type"), "text/plain");
            reqBody = RequestBody.create(MediaType.parse(ct), raw);
        } else if ("multipart".equalsIgnoreCase(bodyType)) {
            MultipartBody.Builder mb = new MultipartBody.Builder().setType(MultipartBody.FORM);
            Object partsObj = content.get("parts");
            if (partsObj instanceof java.util.List) {
                for (Object po : (java.util.List<?>) partsObj) {
                    if (!(po instanceof Map)) continue;
                    Map<String, Object> p = (Map<String, Object>) po;
                    String t = str(p.get("type"), "field");
                    String name = str(p.get("name"), null);
                    if (name == null || name.isEmpty()) continue;
                    if ("file".equalsIgnoreCase(t)) {
                        String fp = str(p.get("file_path"), null);
                        if (fp == null || fp.isEmpty()) continue;
                        String filename = str(p.get("filename"), new File(fp).getName());
                        String ct = str(p.get("content_type"), "application/octet-stream");
                        RequestBody part = RequestBody.create(MediaType.parse(ct), new File(fp));
                        mb.addFormDataPart(name, filename, part);
                    } else {
                        String val = str(p.get("value"), "");
                        mb.addFormDataPart(name, val);
                    }
                }
            }
            reqBody = mb.build();
        }

        String m = method.toUpperCase();
        if (reqBody == null) {
            rb.method(m, null);
        } else {
            rb.method(m, reqBody);
        }

        OkHttpClient base = httpClient;
        OkHttpClient.Builder cb = base.newBuilder();
        cb.followRedirects(Boolean.TRUE.equals(allowRedirects));
        if (timeoutSeconds != null && timeoutSeconds > 0) {
            cb.readTimeout(Duration.ofSeconds(timeoutSeconds));
            cb.writeTimeout(Duration.ofSeconds(timeoutSeconds));
        }
        OkHttpClient client = cb.build();

        long start = System.currentTimeMillis();
        try (Response resp = client.newCall(rb.build()).execute()) {
            int status = resp.code();
            String body = resp.body() != null ? resp.body().string() : "";
            Map<String, String> hs = new java.util.LinkedHashMap<>();
            for (String n : resp.headers().names()) {
                hs.put(n, resp.header(n));
            }
            long elapsed = System.currentTimeMillis() - start;
            java.util.Map<String, Object> rd = new java.util.LinkedHashMap<>();
            rd.put("status", status);
            rd.put("headers", hs);
            rd.put("body", body);
            rd.put("elapsed_ms", elapsed);
            return TaskExecutionResult.success(rd);
        } catch (Exception e) {
            TaskExecutionResult r = new TaskExecutionResult();
            r.setStatus(TaskStatus.failed);
            r.setErrorMessage(e.getMessage());
            return r;
        }
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.http_request;
    }

    private String str(Object o, String d) {
        return o == null ? d : String.valueOf(o);
    }

    private Boolean bool(Object o, Boolean d) {
        return o == null ? d : (o instanceof Boolean ? (Boolean) o : Boolean.parseBoolean(String.valueOf(o)));
    }

    private Integer intv(Object o, Integer d) {
        try {
            return o == null ? d : Integer.parseInt(String.valueOf(o));
        } catch (Exception e) {
            return d;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object o) {
        return (o instanceof Map) ? (Map<String, Object>) o : null;
    }
}