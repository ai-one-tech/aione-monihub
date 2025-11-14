package org.aione.monihub.agent.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CommonUtils {

    private static ObjectMapper objectMapper = null;

    public static ObjectMapper getObjectMapper() {
        if (objectMapper == null) {
            objectMapper = new ObjectMapper();

            // 配置反序列化
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            objectMapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);

            // 配置序列化
            objectMapper.configure(SerializationFeature.INDENT_OUTPUT, true);
            objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

            // 示例设置属性命名策略
            objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        }
        return objectMapper;
    }

    /**
     * 检查当前操作系统是否为Windows
     */
    public static boolean isWindows() {
        String os = System.getProperty("os.name").toLowerCase();
        return os.contains("win");
    }

    public static String getClassName(String code) {
        String regex = "public\\s+class\\s+(\\w+)";
        // 创建模式对象
        Pattern pattern = Pattern.compile(regex);
        // 创建匹配器
        Matcher matcher = pattern.matcher(code);
        // 查找匹配项
        if (matcher.find()) {
            // 获取类名
            String className = matcher.group(1);
            return className;
        }
        return null;
    }
}
