package org.aione.monihub.agent.util;

public class CommonUtils {

    /**
     * 检查当前操作系统是否为Windows
     */
    public static boolean isWindows() {
        String os = System.getProperty("os.name").toLowerCase();
        return os.contains("win");
    }

}
