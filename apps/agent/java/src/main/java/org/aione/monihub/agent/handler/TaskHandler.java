package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskResult;

import java.util.Map;

/**
 * 任务处理器接口
 */
public interface TaskHandler {
    
    /**
     * 执行任务
     * 
     * @param taskContent 任务参数
     * @return 执行结果
     * @throws Exception 执行失败时抛出异常
     */
    TaskResult execute(Map<String, Object> taskContent) throws Exception;
    
    /**
     * 获取支持的任务类型
     * 
     * @return 任务类型
     */
    String getTaskType();
}
