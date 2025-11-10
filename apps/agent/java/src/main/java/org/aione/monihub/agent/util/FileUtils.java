package org.aione.monihub.agent.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class FileUtils {

    /**
     * 读取文件
     *
     * @param filePath
     * @return
     */
    public static String readFile(String filePath) {
        StringBuilder contentBuilder = new StringBuilder();
        try {
            List<String> lines = Files.readAllLines(Paths.get(filePath));
            for (String line : lines) {
                contentBuilder.append(line);
            }
        } catch (IOException e) {
            return null;
        }
        return contentBuilder.toString();
    }

    public static void writeFile(String filePath, String content) throws IOException {
        // 如果路径不存在,则创建
        Path path = Paths.get(filePath);
        if (!Files.exists(path)) {
            // 考虑多级目录不存在的情况
            Files.createDirectories(path.getParent());
        }
        Files.write(path, content.getBytes());
    }
}
