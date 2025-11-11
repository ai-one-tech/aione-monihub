package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.CommandType;
import org.aione.monihub.agent.model.TaskResult;
import org.aione.monihub.agent.model.TaskType;
import org.aione.monihub.agent.service.CustomCommandService;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

/**
 * 命令执行处理器
 */
public class CustomCommandHandler implements TaskHandler {

    private AgentLogger log;

    @Resource
    CustomCommandService customCommandService;

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(CustomCommandHandler.class);
    }

    @Override
    public TaskResult execute(Map<String, Object> taskContent) throws Exception {
        CommandType command = CommandType.valueOf((String) taskContent.get("command"));

        log.info("Executing command: {}", command);
        boolean success = false;
        String message = "";

        // 构建结果数据
        Map<String, Object> resultData = new HashMap<>();

        try {
            success = customCommandService.process(command);
        } catch (Exception e) {
            message = e.getMessage();
        }

        resultData.put("success", success);
        resultData.put("output", message);

        if (success) {
            return TaskResult.success("Command executed successfully", resultData);
        } else {
            return TaskResult.failure("Command failed with");
        }
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.EXECUTE_COMMAND;
    }
}