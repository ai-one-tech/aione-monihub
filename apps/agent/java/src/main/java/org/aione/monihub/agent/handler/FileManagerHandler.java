package org.aione.monihub.agent.handler;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.RequestBody;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;
import org.aione.monihub.agent.config.AgentConfig;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.FileOutputStream;
import java.io.BufferedOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.FileStore;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.aione.monihub.agent.util.TaskLockUtils;
import org.aione.monihub.agent.util.TaskTempUtils;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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

    @javax.annotation.Resource
    private ObjectMapper objectMapper;

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

        TaskExecutionResult guarded = TaskLockUtils.guardWithLock("file-manager", task, () -> {
            FileOperationType operationType = FileOperationType.fromValue(operationTypeStr);
            switch (operationType) {
                case ListDirectory:
                    return executeListDirectory(task);
                case GetFileInfo:
                    return executeGetFileInfo(task);
                case DeleteFile:
                    return executeDeleteFile(task);
                case RenameFile:
                    return executeRenameFile(task);
                case CreateDirectory:
                    return executeCreateDirectory(task);
                case UploadFile:
                    return executeUploadFile(task);
                case DownloadFile:
                    return executeDownloadFile(task);
                case CopyFile:
                    return executeCopyFile(task);
                case MoveFile:
                    return executeMoveFile(task);
                default:
                    TaskExecutionResult r = new TaskExecutionResult();
                    r.setStatus(TaskStatus.failed);
                    r.setErrorMessage("无法识别的 操作类型 " + operationType);
                    return r;
            }
        });
        return guarded;
    }

    /**
     * 查看目录下的文件列表
     */
    private TaskExecutionResult executeListDirectory(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String directoryPath = (String) taskContent.get("directory_path");
        if (directoryPath == null || directoryPath.trim().isEmpty()) {
            return TaskExecutionResult.failure("Directory path is required");
        }

        File directory = new File(directoryPath);
        if (!directory.exists()) {
            return TaskExecutionResult.failure("Directory does not exist: " + directoryPath);
        }
        if (!directory.isDirectory()) {
            return TaskExecutionResult.failure("Path is not a directory: " + directoryPath);
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return TaskExecutionResult.failure("Cannot read directory: " + directoryPath);
        }

        List<Map<String, Object>> fileList = new ArrayList<>();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

        for (File file : files) {
            Map<String, Object> fileInfo = new HashMap<>();
            fileInfo.put("name", file.getName());
            fileInfo.put("path", file.getAbsolutePath());
            fileInfo.put("is_directory", file.isDirectory());
            fileInfo.put("size", file.length());
            fileInfo.put("last_modified", dateFormat.format(new Date(file.lastModified())));
            fileInfo.put("can_read", file.canRead());
            fileInfo.put("can_write", file.canWrite());
            fileInfo.put("can_execute", file.canExecute());

            fileList.add(fileInfo);
        }

        // 按名称排序
        fileList.sort((f1, f2) -> {
            String name1 = (String) f1.get("name");
            String name2 = (String) f2.get("name");
            return name1.compareToIgnoreCase(name2);
        });

        Map<String, Object> resultData = new HashMap<>();
        resultData.put("directory_path", directoryPath);
        resultData.put("file_count", fileList.size());
        resultData.put("files", fileList);

        return TaskExecutionResult.success("Directory listing completed", resultData);
    }

    /**
     * 查看文件信息
     */
    private TaskExecutionResult executeGetFileInfo(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String filePath = (String) taskContent.get("file_path");
        if (filePath == null || filePath.trim().isEmpty()) {
            return TaskExecutionResult.failure("File path is required");
        }

        File file = new File(filePath);
        if (!file.exists()) {
            return TaskExecutionResult.failure("File does not exist: " + filePath);
        }

        Path path = Paths.get(filePath);
        BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);

        Map<String, Object> fileInfo = new HashMap<>();
        fileInfo.put("name", file.getName());
        fileInfo.put("path", file.getAbsolutePath());
        fileInfo.put("is_directory", file.isDirectory());
        fileInfo.put("is_file", file.isFile());
        fileInfo.put("size", file.length());
        fileInfo.put("last_modified", new Date(file.lastModified()));
        fileInfo.put("creation_time", new Date(attrs.creationTime().toMillis()));
        fileInfo.put("last_access", new Date(attrs.lastAccessTime().toMillis()));
        fileInfo.put("can_read", file.canRead());
        fileInfo.put("can_write", file.canWrite());
        fileInfo.put("can_execute", file.canExecute());
        fileInfo.put("is_hidden", file.isHidden());

        if (file.isFile()) {
            fileInfo.put("extension", getFileExtension(file));
            fileInfo.put("mime_type", Files.probeContentType(path));
        }

        Map<String, Object> resultData = new HashMap<>();
        resultData.put("file_info", fileInfo);

        return TaskExecutionResult.success("File information retrieved", resultData);
    }

    /**
     * 删除文件或目录
     */
    private TaskExecutionResult executeDeleteFile(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String filePath = (String) taskContent.get("file_path");
        if (filePath == null || filePath.trim().isEmpty()) {
            return TaskExecutionResult.failure("File path is required");
        }

        File file = new File(filePath);
        if (!file.exists()) {
            return TaskExecutionResult.success("File does not exist, nothing to delete");
        }

        boolean recursive = (Boolean) taskContent.getOrDefault("recursive", false);
        boolean deleted = false;

        if (file.isDirectory() && recursive) {
            deleted = deleteDirectory(file);
        } else {
            deleted = file.delete();
        }

        if (deleted) {
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("deleted_path", filePath);
            resultData.put("was_directory", file.isDirectory());
            return TaskExecutionResult.success("File deleted successfully", resultData);
        } else {
            return TaskExecutionResult.failure("Failed to delete file: " + filePath);
        }
    }

    /**
     * 递归删除目录
     */
    private boolean deleteDirectory(File directory) {
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectory(file);
                } else {
                    file.delete();
                }
            }
        }
        return directory.delete();
    }

    /**
     * 文件改名
     */
    private TaskExecutionResult executeRenameFile(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String oldPath = (String) taskContent.get("old_path");
        String newPath = (String) taskContent.get("new_path");

        if (oldPath == null || newPath == null) {
            return TaskExecutionResult.failure("Old path and new path are required");
        }

        File oldFile = new File(oldPath);
        if (!oldFile.exists()) {
            return TaskExecutionResult.failure("Source file does not exist: " + oldPath);
        }

        File newFile = new File(newPath);
        if (newFile.exists()) {
            boolean overwrite = (Boolean) taskContent.getOrDefault("overwrite", false);
            if (!overwrite) {
                return TaskExecutionResult.failure("Target file already exists and overwrite is disabled");
            }
        }

        boolean renamed = oldFile.renameTo(newFile);
        if (renamed) {
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("old_path", oldPath);
            resultData.put("new_path", newPath);
            return TaskExecutionResult.success("File renamed successfully", resultData);
        } else {
            return TaskExecutionResult.failure("Failed to rename file from " + oldPath + " to " + newPath);
        }
    }

    /**
     * 创建目录
     */
    private TaskExecutionResult executeCreateDirectory(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String directoryPath = (String) taskContent.get("directory_path");
        if (directoryPath == null || directoryPath.trim().isEmpty()) {
            return TaskExecutionResult.failure("Directory path is required");
        }

        File directory = new File(directoryPath);
        if (directory.exists()) {
            return TaskExecutionResult.success("Directory already exists");
        }

        boolean created = directory.mkdirs();
        if (created) {
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("directory_path", directoryPath);
            return TaskExecutionResult.success(resultData);
        } else {
            return TaskExecutionResult.failure("Failed to create directory: " + directoryPath);
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
                return TaskExecutionResult.failure("Failed to download file from " + remoteUrl + ", HTTP status: " + response.code());
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

            long writtenThisTime = 0L;
            try (InputStream inputStream = responseBody.byteStream();
                 BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(partFile, append), 1024 * 1024)) {
                byte[] buffer = new byte[1024 * 1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    bos.write(buffer, 0, bytesRead);
                    writtenThisTime += bytesRead;
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
        Map<String, Object> taskContent = task.getTaskContent();
        String filePath = (String) taskContent.get("path");
        if (filePath == null || filePath.trim().isEmpty()) {
            return TaskExecutionResult.failure("File path is required");
        }

        File target = new File(filePath);
        if (!target.exists()) {
            return TaskExecutionResult.failure("File does not exist: " + filePath);
        }

        boolean isDirectory = target.isDirectory();
        File uploadFile = target;
        String originalName = target.getName();
        if (isDirectory) {
            Path archivesDir = TaskTempUtils.ensureSubDir("archives");
            String zipName = originalName + ".zip";
            Path zipPath = archivesDir.resolve(zipName);
            zipDirectory(target.toPath(), zipPath);
            uploadFile = zipPath.toFile();
            originalName = zipName;
        } else {
            long maxSize = 10L * 1024L * 1024L;
            if (target.length() > maxSize) {
                Path archivesDir = TaskTempUtils.ensureSubDir("archives");
                String zipName = originalName + ".zip";
                Path zipPath = archivesDir.resolve(zipName);
                zipSingleFile(target.toPath(), zipPath, target.getName());
                uploadFile = zipPath.toFile();
                originalName = zipName;
            }
        }

        String taskId = task.getTaskId();
        String instanceId = agentConfig.getInstanceId();

        Map<String, Object> initBody = new HashMap<>();
        initBody.put("file_name", originalName);
        initBody.put("file_size", uploadFile.length());
        int chunkSize = 8 * 1024 * 1024;
        long totalChunks = (uploadFile.length() + chunkSize - 1) / chunkSize;
        initBody.put("chunk_size", chunkSize);
        initBody.put("total_chunks", totalChunks);
        initBody.put("task_id", taskId);
        initBody.put("instance_id", instanceId);
        initBody.put("file_extension", getFileExtension(uploadFile));
        initBody.put("original_file_path", target.getAbsolutePath());
        initBody.put("is_directory", isDirectory);

        String initUrl = agentConfig.getServerUrl() + "/api/files/upload/init";
        RequestBody initReqBody = RequestBody.create(MediaType.parse("application/json"), objectMapper.writeValueAsBytes(initBody));
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
            if (dp instanceof String) initDownloadPath = (String) dp;
            Object idv = m.get("is_directory");
            if (idv instanceof Boolean) initIsDirectory = (Boolean) idv;
            Object cp = m.get("compressed");
            if (cp instanceof Boolean) initCompressed = (Boolean) cp;
            Object fn = m.get("final_name");
            if (fn instanceof String) initFinalName = (String) fn;
            Object sz = m.get("size");
            if (sz instanceof Number) initSize = ((Number) sz).longValue();
            Object sfp = m.get("server_file_path");
            if (sfp instanceof String) initServerFilePath = (String) sfp;
        }

        String chunkUrl = agentConfig.getServerUrl() + "/api/files/upload/chunk";
        MediaType octet = MediaType.parse("application/octet-stream");
        String fileId = null;
        String filePathResp = null;
        boolean completedFlag = false;
        try (InputStream is = Files.newInputStream(uploadFile.toPath())) {
            byte[] buf = new byte[chunkSize];
            long index = 0;
            int r;
            while ((r = is.read(buf)) != -1) {
                MultipartBody.Builder mb = new MultipartBody.Builder().setType(MultipartBody.FORM)
                        .addFormDataPart("upload_id", uploadId)
                        .addFormDataPart("chunk_index", String.valueOf(index))
                        .addFormDataPart("chunk", originalName, RequestBody.create(octet, Arrays.copyOf(buf, r)));
                Request.Builder chunkReqBuilder = new Request.Builder().url(chunkUrl).post(mb.build());
                try (Response cr = httpClient.newCall(chunkReqBuilder.build()).execute()) {
                    if (!cr.isSuccessful()) {
                        return TaskExecutionResult.failure("Chunk upload failed at index " + index + ": HTTP " + cr.code());
                    }
                    Map cm = objectMapper.readValue(cr.body().bytes(), Map.class);
                    Object c = cm.get("completed");
                    if (Boolean.TRUE.equals(c)) {
                        fileId = (String) cm.get("file_id");
                        filePathResp = (String) cm.get("file_path");
                        completedFlag = true;
                        break;
                    }
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
        boolean compressedVal = initCompressed != null ? initCompressed : (isDirectory || originalName.endsWith(".zip"));
        resultData.put("compressed", compressedVal);
        resultData.put("final_name", initFinalName != null ? initFinalName : originalName);
        resultData.put("size", initSize != null ? initSize : uploadFile.length());
        resultData.put("server_file_path", filePathResp != null ? filePathResp : initServerFilePath);

        return TaskExecutionResult.success("File uploaded", resultData);
    }

    /**
     * 复制文件
     */
    private TaskExecutionResult executeCopyFile(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String sourcePath = (String) taskContent.get("source_path");
        String targetPath = (String) taskContent.get("target_path");

        if (sourcePath == null || targetPath == null) {
            return TaskExecutionResult.failure("Source path and target path are required");
        }

        File sourceFile = new File(sourcePath);
        if (!sourceFile.exists()) {
            return TaskExecutionResult.failure("Source file does not exist: " + sourcePath);
        }

        File targetFile = new File(targetPath);
        if (targetFile.exists()) {
            boolean overwrite = (Boolean) taskContent.getOrDefault("overwrite", false);
            if (!overwrite) {
                return TaskExecutionResult.failure("Target file already exists and overwrite is disabled");
            }
        }

        // 确保目标目录存在
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        Files.copy(sourceFile.toPath(), targetFile.toPath());

        Map<String, Object> resultData = new HashMap<>();
        resultData.put("source_path", sourcePath);
        resultData.put("target_path", targetPath);
        resultData.put("file_size", targetFile.length());

        return TaskExecutionResult.success(resultData);
    }

    /**
     * 移动文件
     */
    private TaskExecutionResult executeMoveFile(TaskDispatchItem task) throws Exception {
        Map<String, Object> taskContent = task.getTaskContent();
        String sourcePath = (String) taskContent.get("source_path");
        String targetPath = (String) taskContent.get("target_path");

        if (sourcePath == null || targetPath == null) {
            return TaskExecutionResult.failure("Source path and target path are required");
        }

        File sourceFile = new File(sourcePath);
        if (!sourceFile.exists()) {
            return TaskExecutionResult.failure("Source file does not exist: " + sourcePath);
        }

        File targetFile = new File(targetPath);
        if (targetFile.exists()) {
            boolean overwrite = (Boolean) taskContent.getOrDefault("overwrite", false);
            if (!overwrite) {
                return TaskExecutionResult.failure("Target file already exists and overwrite is disabled");
            }
        }

        // 确保目标目录存在
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        Files.move(sourceFile.toPath(), targetFile.toPath());

        Map<String, Object> resultData = new HashMap<>();
        resultData.put("source_path", sourcePath);
        resultData.put("target_path", targetPath);

        return TaskExecutionResult.success(resultData);
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

    private void zipDirectory(Path sourceDir, Path zipPath) throws Exception {
        try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(zipPath.toFile())))) {
            Files.walk(sourceDir).forEach(p -> {
                try {
                    String entryName = sourceDir.relativize(p).toString();
                    if (entryName.isEmpty()) return;
                    if (Files.isDirectory(p)) return;
                    zos.putNextEntry(new ZipEntry(entryName));
                    Files.copy(p, zos);
                    zos.closeEntry();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
        }
    }

    private void zipSingleFile(Path filePath, Path zipPath, String entryName) throws Exception {
        try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(zipPath.toFile())))) {
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
