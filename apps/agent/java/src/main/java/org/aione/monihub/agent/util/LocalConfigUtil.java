package org.aione.monihub.agent.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aione.monihub.agent.config.LocalConfig;
import org.apache.logging.log4j.util.Strings;

import java.io.IOException;

public class LocalConfigUtil {

    private static final String LOCAL_CONFIG_PATH = "/tmp/monihub/config";

    public static void updateConfig(LocalConfig localConfig) {
        try {
            if (localConfig != null) {
                ObjectMapper objectMapper = SpringContextUtils.getBean(ObjectMapper.class);
                String content = objectMapper.writeValueAsString(localConfig);
                FileUtils.writeFile(LOCAL_CONFIG_PATH, content);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static LocalConfig getConfig() {
        try {
            String content = FileUtils.readFile(LOCAL_CONFIG_PATH);
            if (Strings.isNotBlank(content)) {
                ObjectMapper objectMapper = SpringContextUtils.getBean(ObjectMapper.class);
                return objectMapper.readValue(content, LocalConfig.class);
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

}
