package org.aione.monihub.agent.util;

import org.aione.monihub.agent.config.AgentConfig;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class TaskTempUtils {
    private TaskTempUtils() {
    }

    public static Path baseTempDir() {
//        return Paths.get(System.getProperty("java.io.tmpdir"), "monihub", "task");
        return Paths.get("tmp");
    }

    public static Path ensureBaseTempDir() {
        Path dir = baseTempDir();
        try {
            Files.createDirectories(dir);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create temp directory: " + e.getMessage(), e);
        }
        return dir;
    }

    public static Path ensureSubDir(String... names) {
        Path base = ensureBaseTempDir();
        Path sub = base;
        for (String n : names) {
            sub = sub.resolve(n);
        }
        try {
            Files.createDirectories(sub);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create sub directory: " + e.getMessage(), e);
        }
        return sub;
    }
}
