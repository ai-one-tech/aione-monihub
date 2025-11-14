# 文件管理任务使用指南

## 概述

`FileManagerHandler` 是一个专门用于文件管理操作的任务处理器，支持多种文件操作，包括查看目录、文件信息、上传下载、删除改名等。

## 任务类型

- 任务类型：`file_manager`

## 支持的操作用法

### 1. 查看目录文件列表

**操作类型：** `list_directory`

**参数：**

- `directory_path` (必需): 要查看的目录路径

**示例：**

```json
{
  "operation_type": "list_directory",
  "directory_path": "/home/user/documents"
}
```

**返回结果：**

```json
{
  "code": 0,
  "message": "Directory listing completed",
  "data": {
    "directory_path": "/home/user/documents",
    "file_count": 15,
    "files": [
      {
        "name": "file1.txt",
        "path": "/home/user/documents/file1.txt",
        "is_directory": false,
        "size": 1024,
        "last_modified": "2024-01-05 10:30:25",
        "can_read": true,
        "can_write": true,
        "can_execute": false
      }
    ]
  }
}
```

### 2. 查看文件信息

**操作类型：** `get_file_info`

**参数：**

- `file_path` (必需): 文件路径

**示例：**

```json
{
  "operation_type": "get_file_info",
  "file_path": "/home/user/documents/file1.txt"
}
```

**返回结果：**

```json
{
  "code": 0,
  "message": "File information retrieved",
  "data": {
    "file_info": {
      "name": "file1.txt",
      "path": "/home/user/documents/file1.txt",
      "is_directory": false,
      "is_file": true,
      "size": 1024,
      "last_modified": "2024-01-05T10:30:25Z",
      "creation_time": "2024-01-01T08:15:10Z",
      "last_access": "2024-01-05T10:30:25Z",
      "can_read": true,
      "can_write": true,
      "can_execute": false,
      "is_hidden": false,
      "extension": "txt",
      "mime_type": "text/plain"
    }
  }
}
```

### 3. 删除文件或目录

**操作类型：** `delete_file`

**参数：**

- `file_path` (必需): 要删除的文件或目录路径
- `recursive` (可选): 是否递归删除目录，默认false

**示例：**

```json
{
  "operation_type": "delete_file",
  "file_path": "/home/user/temp/file.txt",
  "recursive": false
}
```

**返回结果：**

```json
{
  "code": 0,
  "message": "File deleted successfully",
  "data": {
    "deleted_path": "/home/user/temp/file.txt",
    "was_directory": false
  }
}
```

### 4. 文件改名

**操作类型：** `rename_file`

**参数：**

- `old_path` (必需): 原文件路径
- `new_path` (必需): 新文件路径
- `overwrite` (可选): 是否覆盖已存在文件，默认false

**示例：**

```json
{
  "operation_type": "rename_file",
  "old_path": "/home/user/old_name.txt",
  "new_path": "/home/user/new_name.txt",
  "overwrite": true
}
```

### 5. 创建目录

**操作类型：** `create_directory`

**参数：**

- `directory_path` (必需): 要创建的目录路径

**示例：**

```json
{
  "operation_type": "create_directory",
  "directory_path": "/home/user/new_folder"
}
```

### 6. 上传文件

**操作类型：** `upload_file`

**参数：**

- `target_path` (必需): 目标文件路径
- `file_content` (必需): Base64编码的文件内容
- `overwrite` (可选): 是否覆盖已存在文件，默认false

**示例：**

```json
{
  "operation_type": "upload_file",
  "target_path": "/home/user/uploaded.txt",
  "file_content": "SGVsbG8gV29ybGQ=",
  "overwrite": true
}
```

### 7. 下载文件

**操作类型：** `download_file`

**参数：**

- `file_path` (必需): 要下载的文件路径

**注意：** 文件大小限制为10MB

**示例：**

```json
{
  "operation_type": "download_file",
  "file_path": "/home/user/file.txt"
}
```

**返回结果：**

```json
{
  "code": 0,
  "message": "File downloaded successfully",
  "data": {
    "file_path": "/home/user/file.txt",
    "file_size": 1024,
    "file_content": "SGVsbG8gV29ybGQ=",
    "mime_type": "text/plain"
  }
}
```

### 8. 复制文件

**操作类型：** `copy_file`

**参数：**

- `source_path` (必需): 源文件路径
- `target_path` (必需): 目标文件路径
- `overwrite` (可选): 是否覆盖已存在文件，默认false

**示例：**

```json
{
  "operation_type": "copy_file",
  "source_path": "/home/user/source.txt",
  "target_path": "/home/user/backup.txt",
  "overwrite": false
}
```

### 9. 移动文件

**操作类型：** `move_file`

**参数：**

- `source_path` (必需): 源文件路径
- `target_path` (必需): 目标文件路径
- `overwrite` (可选): 是否覆盖已存在文件，默认false

**示例：**

```json
{
  "operation_type": "move_file",
  "source_path": "/home/user/temp/file.txt",
  "target_path": "/home/user/documents/file.txt",
  "overwrite": true
}
```

## 错误处理

所有操作都包含完整的错误处理机制。常见的错误包括：

- 文件或目录不存在
- 权限不足
- 路径不是目录或文件
- 文件过大（下载限制10MB）
- 目标文件已存在且不允许覆盖

## 权限要求

文件管理操作需要相应的文件系统权限。请确保Java进程有足够的权限执行所需的文件操作。

## 安全注意事项

1. **路径验证**：所有路径都经过验证，防止路径遍历攻击
2. **文件大小限制**：下载操作限制为10MB
3. **权限检查**：检查文件读/写/执行权限
4. **覆盖保护**：默认不覆盖现有文件

## 使用示例

以下是一个完整的任务创建示例：

```json
{
  "task_type": "file_manager",
  "task_content": {
    "operation_type": "list_directory",
    "directory_path": "/home/user/documents"
  }
}
```

## 支持的平台

- Windows (支持路径如 `C:\\Users\\username\\Documents`)
- Linux/Unix (支持路径如 `/home/user/documents`)
- macOS (支持路径如 `/Users/username/Documents`)