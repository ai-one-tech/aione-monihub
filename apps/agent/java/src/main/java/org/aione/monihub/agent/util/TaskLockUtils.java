package org.aione.monihub.agent.util;

import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskStatus;

import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Callable;

public final class TaskLockUtils {
    private TaskLockUtils() {
    }

    public static TaskExecutionResult guardWithLock(String scope, TaskDispatchItem task, Callable<TaskExecutionResult> action) {
        Path locksDir = TaskTempUtils.ensureSubDir("locks");
        Path lockFile = locksDir.resolve(scope + "-" + task.getTaskId() + ".lock");
        boolean created = false;
        try {
            Files.createFile(lockFile);
            created = true;
        } catch (FileAlreadyExistsException e) {
            TaskExecutionResult running = new TaskExecutionResult();
            running.setStatus(TaskStatus.running);
            running.setResultMessage("任务正在执行中，跳过本次执行");
            running.put("taskId", task.getTaskId());
            return running;
        } catch (Exception e) {
            return TaskExecutionResult.failure("创建锁文件失败: " + e.getMessage());
        }
        try {
            return action.call();
        } catch (Exception e) {
            return TaskExecutionResult.failure(e.getMessage());
        } finally {
            try {
                if (created) {
                    Files.deleteIfExists(lockFile);
                }
            } catch (Exception ignored) {
            }
        }
    }
}
