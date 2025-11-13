package org.aione.monihub.agent.handler;

/**
 * 文件操作类型枚举
 */
public enum FileOperationType {
    ListDirectory("list_directory"),
    GetFileInfo("get_file_info"),
    DeleteFile("delete_file"),
    RenameFile("rename_file"),
    CreateDirectory("create_directory"),
    UploadFile("upload_file"),
    DownloadFile("download_file"),
    CopyFile("copy_file"),
    MoveFile("move_file");

    private final String value;

    FileOperationType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static FileOperationType fromValue(String value) {
        for (FileOperationType type : FileOperationType.values()) {
            if (type.getValue().equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown operation type: " + value);
    }
}