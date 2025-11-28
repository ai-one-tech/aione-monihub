package org.aione.monihub.agent.codes;

import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.model.TaskDispatchItem;

import java.util.HashMap;
import java.util.Map;

/**
 * 代码示例
 */
public class RunnerCodeExample {

    public Map<String, Object> runner(TaskDispatchItem task) {

        Map<String, Object> result = new HashMap<>();

        AgentConfig agentConfig = AgentConfig.instance();

        result.put("agentConfig", agentConfig);

        return result;

    }

}
