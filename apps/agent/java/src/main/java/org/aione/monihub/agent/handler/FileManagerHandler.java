package org.aione.monihub.agent.handler;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.FileStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.util.CommonUtils;
import org.aione.monihub.agent.util.TaskTempUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * 文件管理处理器
 * 支持查看目录文件列表、查看文件信息、上传文件、下载文件、删除文件、文件改名等操作
 */
public class FileManagerHandler implements TaskHandler {

    private AgentLogger log;

    @javax.annotation.Resource
    private OkHttpClient httpClient;

    @javax.annotation.Resource
    private AgentConfig agentConfig;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(FileManagerHandler.class);
    }

    @Override
    public TaskExecutionResult execute(TaskDispatchItem task) throws Exception {

        TaskExecutionResult result = new TaskExecutionResult();

        Map<String, Object> taskContent = task.getTaskContent();
        String operationTypeStr = (String) taskContent.get("operation");
        if (operationTypeStr == null || operationTypeStr.trim().isEmpty()) {
            result.setStatus(TaskStatus.failed);
            result.setErrorMessage("没有需要执行的脚本");
            return result;
        }

        log.info("Executing file operation: {}", operationTypeStr);

        FileOperationType operationType = FileOperationType.fromValue(operationTypeStr);
        switch (operationType) {
            case UploadFile:
                return executeUploadFile(task);
            case DownloadFile:
                return executeDownloadFile(task);
            default:
                TaskExecutionResult r = new TaskExecutionResult();
                r.setStatus(TaskStatus.failed);
                r.setErrorMessage("无法识别的 操作类型 " + operationType);
                return r;
        }
    }

    /**
     * 上传文件（从远程URL下载并保存到指定路径）
     */
    private TaskExecutionResult executeUploadFile(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String savePath = (String) taskContent.get("save");
        if (savePath == null || savePath.trim().isEmpty()) {
            savePath = (String) taskContent.get("path");
        }
        String remoteUrl = (String) taskContent.get("remote_url");

        if (savePath == null || remoteUrl == null) {
            return TaskExecutionResult.failure("Target path and remote HTTP URL are required");
        }

        // 确定最终的文件路径和名称
        File saveTarget = new File(savePath);
        boolean dirIntent = saveTarget.isDirectory()
                || savePath.endsWith(java.io.File.separator)
                || savePath.endsWith("/")
                || savePath.endsWith("\\");
        File saveFile;
        if (dirIntent) {
            String fileName = getFileNameFromUrl(remoteUrl);
            saveFile = new File(savePath, fileName);
        } else {
            saveFile = saveTarget;
        }

        File partFile = new File(saveFile.getAbsolutePath() + ".part");

        // 确保父目录存在
        File parentDir = saveFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            Files.createDirectories(parentDir.toPath());
        }

        // 构建客户端（派生更长超时）
        OkHttpClient client = (this.httpClient != null
                ? this.httpClient.newBuilder()
                : new OkHttpClient.Builder())
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(1, TimeUnit.HOURS)
                .writeTimeout(1, TimeUnit.HOURS)
                .retryOnConnectionFailure(true)
                .followRedirects(true)
                .connectionPool(new okhttp3.ConnectionPool(10, 5, TimeUnit.MINUTES))
                .protocols(Arrays.asList(okhttp3.Protocol.HTTP_1_1)) // 强制使用HTTP/1.1避免HTTP/2相关问题
                .build();

        // 预检：获取 Content-Length，决定是否自动续传
        long contentLength = -1L;
        try {
            Request headReq = new Request.Builder()
                    .url(remoteUrl)
                    .method("HEAD", null)
                    .build();
            try (Response headResp = client.newCall(headReq).execute()) {
                if (headResp.isSuccessful()) {
                    String cl = headResp.header("Content-Length");
                    if (cl != null) {
                        try {
                            contentLength = Long.parseLong(cl);
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        boolean autoResume = contentLength >= 10L * 1024L * 1024L;
        long existingBytes = (autoResume && partFile.exists()) ? partFile.length() : 0L;

        // 若无法获取长度，但存在 .part 文件，则仍按续传处理
        if (contentLength < 0 && partFile.exists()) {
            autoResume = true;
            existingBytes = partFile.length();
        }

        // 非续传场景清理旧的 .part 文件
        if (!autoResume && partFile.exists()) {
            Files.deleteIfExists(partFile.toPath());
        }

        // 磁盘空间预检（若可获取长度）
        if (contentLength > 0) {
            try {
                FileStore store = Files.getFileStore(saveFile.toPath());
                long need = contentLength - existingBytes;
                if (store.getUsableSpace() < need) {
                    return TaskExecutionResult.failure("Insufficient disk space: need " + need + " bytes");
                }
            } catch (Exception ignored) {
            }
        }

        // 构造下载请求
        Request.Builder reqBuilder = new Request.Builder()
                .url(remoteUrl)
                .header("Accept-Encoding", "identity");
        if (existingBytes > 0) {
            reqBuilder.header("Range", "bytes=" + existingBytes + "-");
        }
        Request request = reqBuilder.build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                return TaskExecutionResult
                        .failure("Failed to download file from " + remoteUrl + ", HTTP status: " + response.code());
            }

            ResponseBody responseBody = response.body();
            if (responseBody == null) {
                return TaskExecutionResult.failure("Empty response body when downloading file from " + remoteUrl);
            }

            boolean append = existingBytes > 0;
            // 如果请求了 Range 但返回 200，说明服务端不支持/忽略 Range，回退为全量下载
            if (append && response.code() == 200) {
                append = false;
                existingBytes = 0L;
                Files.deleteIfExists(partFile.toPath());
            }

            try (InputStream inputStream = responseBody.byteStream();
                    BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(partFile, append),
                            1024 * 1024)) {
                byte[] buffer = new byte[1024 * 1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    bos.write(buffer, 0, bytesRead);
                }
            }

            // 成功后原子替换到最终文件
            Files.move(partFile.toPath(), saveFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

            Map<String, Object> resultData = new HashMap<>();
            resultData.put("save_path", saveFile.getAbsolutePath());
            resultData.put("tmp_path", partFile.getAbsolutePath());
            resultData.put("bytes_written", saveFile.length());
            if (contentLength > 0) {
                resultData.put("content_length", contentLength);
            }
            resultData.put("resumed", existingBytes > 0);

            return TaskExecutionResult.success(resultData);
        }
    }

    /**
     * 从URL中提取文件名
     */
    private String getFileNameFromUrl(String url) {
        try {
            String path = new URL(url).getPath();
            int lastSlashIndex = path.lastIndexOf('/');
            if (lastSlashIndex != -1 && lastSlashIndex < path.length() - 1) {
                return path.substring(lastSlashIndex + 1);
            }
        } catch (Exception e) {
            // 如果解析URL失败，返回默认文件名
            log.warn("Failed to parse URL to extract filename: " + url, e);
        }
        return "downloaded_file";
    }

    /**
     * 下载文件（返回Base64编码的文件内容）
     */
    private TaskExecutionResult executeDownloadFile(TaskDispatchItem task) throws Exception {
        ObjectMapper objectMapper = CommonUtils.getObjectMapper();
        Map<String, Object> taskContent = task.getTaskContent();
        String filePath = (String) taskContent.get("path");
        if (filePath == null || filePath.trim().isEmpty()) {
            return TaskExecutionResult.failure("File path is required");
        }

        File target = new File(filePath);
        if (!target.exists()) {
            return TaskExecutionResult.failure("File does not exist: " + filePath);
        }

        boolean isZip = false;
        boolean isDirectory = target.isDirectory();
        File uploadFile = target;
        String originalName = target.getName();
        if (isDirectory) {
            isZip = true;
        } else {

            // 判断是否是压缩文件，需要定义常见压缩文件的格式
            boolean isCompressedFile = false;
            String[] zipExtensions = { ".zip", ".rar", ".7z", ".tar", ".gz" };
            for (String ext : zipExtensions) {
                if (originalName.toLowerCase().endsWith(ext)) {
                    isCompressedFile = true;
                    break;
                }
            }

            long maxSize = 10L * 1024L * 1024L;
            if (target.length() > maxSize && !isCompressedFile) {
                isZip = true;
            }
        }

        if (isZip) {
            Path archivesDir = TaskTempUtils.ensureSubDir("archives");
            String zipName = originalName + ".zip";
            Path zipPath = archivesDir.resolve(zipName);
            zipSingleFile(target.toPath(), zipPath, target.getName());
            uploadFile = zipPath.toFile();
            originalName = zipName;
        }

        Map<String, Object> initBody = new HashMap<>();
        initBody.put("file_name", originalName);
        initBody.put("is_zip", isZip);
        initBody.put("file_size", uploadFile.length());
        int chunkSize = 8 * 1024 * 1024;
        long totalChunks = (uploadFile.length() + chunkSize - 1) / chunkSize;
        initBody.put("chunk_size", chunkSize);
        initBody.put("total_chunks", totalChunks);
        initBody.put("task_id", task.getTaskId());
        initBody.put("instance_id", task.getInstanceId());
        initBody.put("file_extension", getFileExtension(uploadFile));
        initBody.put("original_file_path", target.getAbsolutePath());
        initBody.put("is_directory", isDirectory);

        String initUrl = agentConfig.getServerUrl() + "/api/files/upload/init";
        RequestBody initReqBody = RequestBody.create(MediaType.parse("application/json"),
                objectMapper.writeValueAsBytes(initBody));
        Request.Builder initReqBuilder = new Request.Builder().url(initUrl).post(initReqBody);
        String uploadId;
        String initDownloadPath = null;
        Boolean initIsDirectory = null;
        Boolean initCompressed = null;
        String initFinalName = null;
        Long initSize = null;
        String initServerFilePath = null;
        try (Response resp = httpClient.newCall(initReqBuilder.build()).execute()) {
            if (!resp.isSuccessful()) {
                return TaskExecutionResult.failure("Init upload failed: HTTP " + resp.code());
            }
            Map m = objectMapper.readValue(resp.body().bytes(), Map.class);
            uploadId = (String) m.get("upload_id");
            Object dp = m.get("download_path");
            if (dp instanceof String)
                initDownloadPath = (String) dp;
            Object idv = m.get("is_directory");
            if (idv instanceof Boolean)
                initIsDirectory = (Boolean) idv;
            Object cp = m.get("compressed");
            if (cp instanceof Boolean)
                initCompressed = (Boolean) cp;
            Object fn = m.get("final_name");
            if (fn instanceof String)
                initFinalName = (String) fn;
            Object sz = m.get("size");
            if (sz instanceof Number)
                initSize = ((Number) sz).longValue();
            Object sfp = m.get("server_file_path");
            if (sfp instanceof String)
                initServerFilePath = (String) sfp;
        }

        String chunkUrl = agentConfig.getServerUrl() + "/api/files/upload/chunk";
        MediaType octet = MediaType.parse("application/octet-stream");
        String fileId = null;
        String filePathResp = null;
        boolean completedFlag = false;

        // 配置分片上传参数 - 智能重试策略
        int maxRetries = 3;
        long retryDelayMs = 1000; // 初始重试延迟1秒
        int currentChunkSize = chunkSize;
        boolean adaptiveChunkSize = true; // 启用自适应分片大小
        int minChunkSize = 1024 * 1024; // 最小分片大小1MB

        // 为分片上传创建专用的HTTP客户端，配置更合适的超时
        OkHttpClient chunkClient = httpClient.newBuilder()
                .connectTimeout(60, TimeUnit.SECONDS) // 分片上传需要更长的连接超时
                .readTimeout(5, TimeUnit.MINUTES) // 分片上传需要更长的读取超时
                .writeTimeout(5, TimeUnit.MINUTES) // 分片上传需要更长的写入超时
                .connectionPool(new okhttp3.ConnectionPool(5, 2, TimeUnit.MINUTES))
                .protocols(Arrays.asList(okhttp3.Protocol.HTTP_1_1))
                .build();

        // 支持断点续传：检查已上传的分片
        Set<Long> uploadedChunks = new HashSet<>();
        String resumeUrl = agentConfig.getServerUrl() + "/api/files/upload/resume";
        try {
            Request resumeReq = new Request.Builder()
                    .url(resumeUrl + "?upload_id=" + uploadId)
                    .get()
                    .build();
            try (Response resumeResp = chunkClient.newCall(resumeReq).execute()) {
                if (resumeResp.isSuccessful()) {
                    Map resumeData = objectMapper.readValue(resumeResp.body().bytes(), Map.class);
                    List<Integer> completedChunks = (List<Integer>) resumeData.get("completed_chunks");
                    if (completedChunks != null) {
                        completedChunks.forEach(chunk -> uploadedChunks.add(chunk.longValue()));
                        log.info("Resuming upload from chunk {} of {}, already completed: {} chunks",
                                uploadedChunks.size(), totalChunks, uploadedChunks.size());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check upload resume status, starting from beginning: {}", e.getMessage());
        }

        try (InputStream is = Files.newInputStream(uploadFile.toPath())) {
            byte[] buf = new byte[currentChunkSize];
            long index = 0;
            int r;
            int consecutiveFailures = 0; // 连续失败计数器
            long totalBytesRead = 0; // 跟踪已读取的字节数

            // 支持mark/reset以便重新读取数据
            if (is.markSupported()) {
                is.mark(currentChunkSize * 2); // 标记当前位置，允许重置
            }

            while ((r = is.read(buf)) != -1) {
                // 跳过已上传的分片（断点续传）
                if (uploadedChunks.contains(index)) {
                    totalBytesRead += r;
                    index++;
                    continue;
                }

                boolean chunkUploaded = false;
                int retryCount = 0;
                int currentRetryChunkSize = currentChunkSize; // 当前重试的分片大小

                while (!chunkUploaded && retryCount < maxRetries) {
                    try {
                        // 自适应分片大小调整：如果连续失败，减小分片大小
                        if (retryCount > 0 && adaptiveChunkSize && consecutiveFailures > 1) {
                            int newChunkSize = Math.max(minChunkSize, currentRetryChunkSize / 2);
                            if (newChunkSize < currentRetryChunkSize && is.markSupported()) {
                                log.info("Reducing chunk size from {} to {} bytes due to consecutive failures",
                                        currentRetryChunkSize, newChunkSize);
                                currentRetryChunkSize = newChunkSize;
                                // 重新调整缓冲区大小并重置流位置
                                buf = new byte[currentRetryChunkSize];
                                is.reset(); // 重置到标记位置
                                r = is.read(buf, 0, currentRetryChunkSize);
                                if (r == -1)
                                    break;
                            }
                        }

                        // 创建分片数据（避免不必要的数组复制）
                        RequestBody chunkBody = RequestBody.create(octet, buf, 0, r);
                        MultipartBody.Builder mb = new MultipartBody.Builder().setType(MultipartBody.FORM)
                                .addFormDataPart("upload_id", uploadId)
                                .addFormDataPart("chunk_index", String.valueOf(index))
                                .addFormDataPart("chunk_size", String.valueOf(r))
                                .addFormDataPart("chunk", originalName, chunkBody);

                        Request.Builder chunkReqBuilder = new Request.Builder()
                                .url(chunkUrl)
                                .post(mb.build())
                                .header("Connection", "keep-alive")
                                .header("Accept", "application/json")
                                .header("Content-Length", String.valueOf(r)); // 明确指定内容长度

                        log.info(
                                "Uploading chunk {}/{} for uploadId: {}, size: {} bytes, attempt: {}/{}, consecutiveFailures: {}",
                                index + 1, totalChunks, uploadId, r, retryCount + 1, maxRetries, consecutiveFailures);

                        try (Response cr = chunkClient.newCall(chunkReqBuilder.build()).execute()) {
                            if (!cr.isSuccessful()) {
                                String errorBody = "";
                                try {
                                    errorBody = new String(cr.body().bytes());
                                } catch (Exception e) {
                                    log.warn("Failed to read error response body", e);
                                }

                                consecutiveFailures++;
                                log.warn(
                                        "Chunk upload failed at index {}: HTTP {} - {}, attempt: {}/{}, consecutiveFailures: {}, error body: {}",
                                        index, cr.code(), cr.message(), retryCount + 1, maxRetries, consecutiveFailures,
                                        errorBody);

                                // 特定错误码的特殊处理
                                if (cr.code() == 413) { // Request Entity Too Large
                                    if (adaptiveChunkSize && currentRetryChunkSize > minChunkSize) {
                                        log.info("Server returned 413, significantly reducing chunk size");
                                        currentRetryChunkSize = Math.max(minChunkSize, currentRetryChunkSize / 4);
                                        retryCount--; // 不消耗重试次数
                                        Thread.sleep(2000); // 等待2秒后重试
                                        continue;
                                    }
                                } else if (cr.code() >= 500 && cr.code() < 600) {
                                    // 服务器错误，等待更长时间
                                    log.info("Server error detected, waiting longer before retry");
                                    Thread.sleep(retryDelayMs * (retryCount + 2));
                                }

                                if (retryCount < maxRetries - 1) {
                                    retryCount++;
                                    Thread.sleep(retryDelayMs * retryCount); // 指数退避
                                    continue;
                                } else {
                                    return TaskExecutionResult.failure(String.format(
                                            "Chunk upload failed at index %d after %d retries. HTTP %d - %s, error: %s, consecutiveFailures: %d",
                                            index, maxRetries, cr.code(), cr.message(), errorBody,
                                            consecutiveFailures));
                                }
                            }

                            // 重置连续失败计数器
                            if (consecutiveFailures > 0) {
                                log.info("Chunk upload succeeded, resetting consecutive failures counter from {} to 0",
                                        consecutiveFailures);
                                consecutiveFailures = 0;
                            }

                            // 更新字节计数
                            totalBytesRead += r;

                            // 更新流的标记位置
                            if (is.markSupported() && index < totalChunks - 1) {
                                is.mark(currentChunkSize * 2);
                            }

                            Map cm = objectMapper.readValue(cr.body().bytes(), Map.class);
                            Object c = cm.get("completed");
                            if (Boolean.TRUE.equals(c)) {
                                fileId = (String) cm.get("file_id");
                                filePathResp = (String) cm.get("file_path");
                                completedFlag = true;
                                log.info(
                                        "File upload completed, fileId: {}, total chunks: {}, final chunk size: {} bytes",
                                        fileId, index + 1, r);
                                chunkUploaded = true;
                                break;
                            } else {
                                chunkUploaded = true; // 分片上传成功但未完成
                            }
                        }
                    } catch (Exception e) {
                        consecutiveFailures++;
                        log.warn(
                                "Exception during chunk upload at index {}, attempt: {}/{}, consecutiveFailures: {}, error: {}",
                                index, retryCount + 1, maxRetries, consecutiveFailures, e.getMessage());

                        if (retryCount < maxRetries - 1) {
                            retryCount++;
                            Thread.sleep(retryDelayMs * retryCount);
                        } else {
                            return TaskExecutionResult.failure(String.format(
                                    "Chunk upload failed at index %d after %d retries, consecutiveFailures: %d, error: %s",
                                    index, maxRetries, consecutiveFailures, e.getMessage()));
                        }
                    }
                }

                if (!chunkUploaded) {
                    // 收集更多诊断信息
                    String diagnosticInfo = String.format(
                            "Chunk upload failed diagnostics - Index: %d, UploadId: %s, File: %s, OriginalChunkSize: %d, "
                                    +
                                    "CurrentChunkSize: %d, TotalChunks: %d, Retries: %d, FileSize: %d bytes, ConsecutiveFailures: %d",
                            index, uploadId, originalName, chunkSize, currentRetryChunkSize,
                            totalChunks, maxRetries, uploadFile.length(), consecutiveFailures);
                    log.error("All retry attempts failed for chunk upload. {}", diagnosticInfo);

                    return TaskExecutionResult.failure(
                            String.format(
                                    "Failed to upload chunk at index %d after %d retries (consecutive failures: %d). %s",
                                    index, maxRetries, consecutiveFailures, diagnosticInfo));
                }

                index++;
            }
        }
        if (!completedFlag) {
            return TaskExecutionResult.failure("Upload did not complete");
        }

        Map<String, Object> resultData = new HashMap<>();
        String downloadUrl;
        if (initDownloadPath != null) {
            downloadUrl = agentConfig.getServerUrl() + initDownloadPath;
        } else {
            downloadUrl = agentConfig.getServerUrl() + "/api/files/download/" + fileId;
        }
        resultData.put("download_url", downloadUrl);
        resultData.put("file_record_id", fileId);
        resultData.put("is_directory", initIsDirectory != null ? initIsDirectory : isDirectory);
        boolean compressedVal = initCompressed != null ? initCompressed
                : (isDirectory || originalName.endsWith(".zip"));
        resultData.put("compressed", compressedVal);
        resultData.put("final_name", initFinalName != null ? initFinalName : originalName);
        resultData.put("size", initSize != null ? initSize : uploadFile.length());
        resultData.put("server_file_path", filePathResp != null ? filePathResp : initServerFilePath);

        return TaskExecutionResult.success("File uploaded", resultData);
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(File file) {
        String name = file.getName();
        int lastIndexOf = name.lastIndexOf(".");
        if (lastIndexOf == -1) {
            return "";
        }
        return name.substring(lastIndexOf + 1);
    }

    private void zipSingleFile(Path filePath, Path zipPath, String entryName) throws Exception {
        try (ZipOutputStream zos = new ZipOutputStream(
                new BufferedOutputStream(new FileOutputStream(zipPath.toFile())))) {
            zos.putNextEntry(new ZipEntry(entryName));
            Files.copy(filePath, zos);
            zos.closeEntry();
        }
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.file_manager;
    }
}
