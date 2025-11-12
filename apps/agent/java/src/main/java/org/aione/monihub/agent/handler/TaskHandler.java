package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.model.TaskExecutionResult;
import org.aione.monihub.agent.model.TaskType;

/**
 * 任务处理器接口
 */
public interface TaskHandler {

    /**
     * 执行任务
     *
     * @param task 任务参数
     * @return 执行结果
     * @throws Exception 执行失败时抛出异常
     */
    TaskExecutionResult execute(TaskDispatchItem task) throws Exception;

    /**
     * 获取支持的任务类型
     *
     * @return 任务类型
     */
    TaskType getTaskType();
}
