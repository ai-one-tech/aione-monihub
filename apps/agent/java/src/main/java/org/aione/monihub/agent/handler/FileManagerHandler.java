package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskResult;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * 文件管理处理器
 * 支持查看目录文件列表、查看文件信息、上传文件、下载文件、删除文件、文件改名等操作
 */
public class FileManagerHandler implements TaskHandler {

    private AgentLogger log;

    private static final String OPERATION_TYPE = "operation_type";

    // 文件操作类型定义
    public static final String OP_LIST_DIR = "list_directory";
    public static final String OP_GET_FILE_INFO = "get_file_info";
    public static final String OP_DELETE_FILE = "delete_file";
    public static final String OP_RENAME_FILE = "rename_file";
    public static final String OP_CREATE_DIR = "create_directory";
    public static final String OP_UPLOAD_FILE = "upload_file";
    public static final String OP_DOWNLOAD_FILE = "download_file";
    public static final String OP_COPY_FILE = "copy_file";
    public static final String OP_MOVE_FILE = "move_file";

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(FileManagerHandler.class);
    }

    @Override
    public TaskResult execute(Map<String, Object> taskContent) throws Exception {
        String operationType = (String) taskContent.get(OPERATION_TYPE);
        if (operationType == null || operationType.trim().isEmpty()) {
            return TaskResult.failure("Operation type is required");
        }

        log.info("Executing file operation: {}", operationType);

        try {
            switch (operationType) {
                case OP_LIST_DIR:
                    return executeListDirectory(taskContent);
                case OP_GET_FILE_INFO:
                    return executeGetFileInfo(taskContent);
                case OP_DELETE_FILE:
                    return executeDeleteFile(taskContent);
                case OP_RENAME_FILE:
                    return executeRenameFile(taskContent);
                case OP_CREATE_DIR:
                    return executeCreateDirectory(taskContent);
                case OP_UPLOAD_FILE:
                    return executeUploadFile(taskContent);
                case OP_DOWNLOAD_FILE:
                    return executeDownloadFile(taskContent);
                case OP_COPY_FILE:
                    return executeCopyFile(taskContent);
                case OP_MOVE_FILE:
                    return executeMoveFile(taskContent);
                default:
                    return TaskResult.failure("Unsupported operation type: " + operationType);
            }
        } catch (Exception e) {
            log.error("File operation failed: {}", operationType, e);
            return TaskResult.failure("Operation failed: " + e.getMessage());
        }
    }

    /**
     * 查看目录下的文件列表
     */
    private TaskResult executeListDirectory(Map<String, Object> taskContent) throws Exception {
        String directoryPath = (String) taskContent.get("directory_path");
        if (directoryPath == null || directoryPath.trim().isEmpty()) {
            return TaskResult.failure("Directory path is required");
        }

        File directory = new File(directoryPath);
        if (!directory.exists()) {
            return TaskResult.failure("Directory does not exist: " + directoryPath);
        }
        if (!directory.isDirectory()) {
            return TaskResult.failure("Path is not a directory: " + directoryPath);
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return TaskResult.failure("Cannot read directory: " + directoryPath);
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

        return TaskResult.success("Directory listing completed", resultData);
    }

    /**
     * 查看文件信息
     */
    private TaskResult executeGetFileInfo(Map<String, Object> taskContent) throws Exception {
        String filePath = (String) taskContent.get("file_path");
        if (filePath == null || filePath.trim().isEmpty()) {
            return TaskResult.failure("File path is required");
        }

        File file = new File(filePath);
        if (!file.exists()) {
            return TaskResult.failure("File does not exist: " + filePath);
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

        return TaskResult.success("File information retrieved", resultData);
    }

    /**
     * 删除文件或目录
     */
    private TaskResult executeDeleteFile(Map<String, Object> taskContent) throws Exception {
        String filePath = (String) taskContent.get("file_path");
        if (filePath == null || filePath.trim().isEmpty()) {
            return TaskResult.failure("File path is required");
        }

        File file = new File(filePath);
        if (!file.exists()) {
            return TaskResult.success("File does not exist, nothing to delete");
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
            return TaskResult.success("File deleted successfully", resultData);
        } else {
            return TaskResult.failure("Failed to delete file: " + filePath);
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
    private TaskResult executeRenameFile(Map<String, Object> taskContent) throws Exception {
        String oldPath = (String) taskContent.get("old_path");
        String newPath = (String) taskContent.get("new_path");
        
        if (oldPath == null || newPath == null) {
            return TaskResult.failure("Old path and new path are required");
        }

        File oldFile = new File(oldPath);
        if (!oldFile.exists()) {
            return TaskResult.failure("Source file does not exist: " + oldPath);
        }

        File newFile = new File(newPath);
        if (newFile.exists()) {
            boolean overwrite = (Boolean) taskContent.getOrDefault("overwrite", false);
            if (!overwrite) {
                return TaskResult.failure("Target file already exists and overwrite is disabled");
            }
        }

        boolean renamed = oldFile.renameTo(newFile);
        if (renamed) {
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("old_path", oldPath);
            resultData.put("new_path", newPath);
            return TaskResult.success("File renamed successfully", resultData);
        } else {
            return TaskResult.failure("Failed to rename file from " + oldPath + " to " + newPath);
        }
    }

    /**
     * 创建目录
     */
    private TaskResult executeCreateDirectory(Map<String, Object> taskContent) throws Exception {
        String directoryPath = (String) taskContent.get("directory_path");
        if (directoryPath == null || directoryPath.trim().isEmpty()) {
            return TaskResult.failure("Directory path is required");
        }

        File directory = new File(directoryPath);
        if (directory.exists()) {
            return TaskResult.success("Directory already exists");
        }

        boolean created = directory.mkdirs();
        if (created) {
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("directory_path", directoryPath);
            return TaskResult.success("Directory created successfully", resultData);
        } else {
            return TaskResult.failure("Failed to create directory: " + directoryPath);
        }
    }

    /**
     * 上传文件（模拟 - 实际需要Base64编码的文件内容）
     */
    private TaskResult executeUploadFile(Map<String, Object> taskContent) throws Exception {
        String targetPath = (String) taskContent.get("target_path");
        String fileContent = (String) taskContent.get("file_content");
        
        if (targetPath == null || fileContent == null) {
            return TaskResult.failure("Target path and file content are required");
        }

        File targetFile = new File(targetPath);
        if (targetFile.exists()) {
            boolean overwrite = (Boolean) taskContent.getOrDefault("overwrite", false);
            if (!overwrite) {
                return TaskResult.failure("Target file already exists and overwrite is disabled");
            }
        }

        // 确保父目录存在
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        // 解码Base64内容并写入文件
        byte[] content = Base64.getDecoder().decode(fileContent);
        try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write(content);
        }

        Map<String, Object> resultData = new HashMap<>();
        resultData.put("target_path", targetPath);
        resultData.put("file_size", targetFile.length());

        return TaskResult.success("File uploaded successfully", resultData);
    }

    /**
     * 下载文件（返回Base64编码的文件内容）
     */
    private TaskResult executeDownloadFile(Map<String, Object> taskContent) throws Exception {
        String filePath = (String) taskContent.get("file_path");
        if (filePath == null || filePath.trim().isEmpty()) {
            return TaskResult.failure("File path is required");
        }

        File file = new File(filePath);
        if (!file.exists()) {
            return TaskResult.failure("File does not exist: " + filePath);
        }
        if (!file.isFile()) {
            return TaskResult.failure("Path is not a file: " + filePath);
        }

        // 检查文件大小限制（最大10MB）
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.length() > maxSize) {
            return TaskResult.failure("File is too large (max 10MB): " + file.length() + " bytes");
        }

        // 读取文件内容并编码为Base64
        byte[] fileContent = Files.readAllBytes(file.toPath());
        String encodedContent = Base64.getEncoder().encodeToString(fileContent);

        Map<String, Object> resultData = new HashMap<>();
        resultData.put("file_path", filePath);
        resultData.put("file_size", file.length());
        resultData.put("file_content", encodedContent);
        resultData.put("mime_type", Files.probeContentType(file.toPath()));

        return TaskResult.success("File downloaded successfully", resultData);
    }

    /**
     * 复制文件
     */
    private TaskResult executeCopyFile(Map<String, Object> taskContent) throws Exception {
        String sourcePath = (String) taskContent.get("source_path");
        String targetPath = (String) taskContent.get("target_path");
        
        if (sourcePath == null || targetPath == null) {
            return TaskResult.failure("Source path and target path are required");
        }

        File sourceFile = new File(sourcePath);
        if (!sourceFile.exists()) {
            return TaskResult.failure("Source file does not exist: " + sourcePath);
        }

        File targetFile = new File(targetPath);
        if (targetFile.exists()) {
            boolean overwrite = (Boolean) taskContent.getOrDefault("overwrite", false);
            if (!overwrite) {
                return TaskResult.failure("Target file already exists and overwrite is disabled");
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

        return TaskResult.success("File copied successfully", resultData);
    }

    /**
     * 移动文件
     */
    private TaskResult executeMoveFile(Map<String, Object> taskContent) throws Exception {
        String sourcePath = (String) taskContent.get("source_path");
        String targetPath = (String) taskContent.get("target_path");
        
        if (sourcePath == null || targetPath == null) {
            return TaskResult.failure("Source path and target path are required");
        }

        File sourceFile = new File(sourcePath);
        if (!sourceFile.exists()) {
            return TaskResult.failure("Source file does not exist: " + sourcePath);
        }

        File targetFile = new File(targetPath);
        if (targetFile.exists()) {
            boolean overwrite = (Boolean) taskContent.getOrDefault("overwrite", false);
            if (!overwrite) {
                return TaskResult.failure("Target file already exists and overwrite is disabled");
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

        return TaskResult.success("File moved successfully", resultData);
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

    @Override
    public TaskType getTaskType() {
        return TaskType.FILE_MANAGER;
    }
}