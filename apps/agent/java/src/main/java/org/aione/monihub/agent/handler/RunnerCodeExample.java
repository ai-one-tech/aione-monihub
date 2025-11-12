package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.model.TaskDispatchItem;
import org.aione.monihub.agent.util.SpringContextUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * 代码示例
 */
public class RunnerCodeExample {

    public Map<String, Object> runner(TaskDispatchItem task) {

        Map<String, Object> result = new HashMap<>();

        AgentConfig agentConfig = SpringContextUtils.getBean(AgentConfig.class);

        result.put("agentConfig", agentConfig);

        return result;

    }

}
