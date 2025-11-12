package org.aione.monihub.agent.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CommonUtils {

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
