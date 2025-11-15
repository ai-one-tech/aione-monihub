package org.aione.monihub.agent.util;

import org.aione.monihub.agent.config.AgentConfig;
import org.aione.monihub.agent.model.AgentLogItem;
import org.aione.monihub.agent.model.AgentLogLevel;
import org.springframework.boot.logging.LogLevel;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

public class AgentLogStore {
    private static final AgentLogStore INSTANCE = new AgentLogStore();
    private final Deque<AgentLogItem> buffer = new ArrayDeque<>();
    private final ReentrantLock lock = new ReentrantLock();

    public static AgentLogStore getInstance() {
        return INSTANCE;
    }

    public void append(LogLevel level, String message, Map<String, Object> context) {
        AgentLogItem item = new AgentLogItem();
        item.setLogLevel(AgentLogLevel.valueOf(level.toString().toLowerCase()));
        item.setMessage(message);
        item.setContext(context);
        item.setTimestamp(ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        lock.lock();
        try {
            buffer.addLast(item);
            int maxRetention = getMaxRetention();
            while (buffer.size() > maxRetention && !buffer.isEmpty()) {
                buffer.removeFirst();
            }
        } finally {
            lock.unlock();
        }
    }

    public List<AgentLogItem> snapshotPending() {
        lock.lock();
        try {
            return new ArrayList<>(buffer);
        } finally {
            lock.unlock();
        }
    }

    public void removeSent(int count) {
        if (count <= 0) return;
        lock.lock();
        try {
            for (int i = 0; i < count && !buffer.isEmpty(); i++) {
                buffer.removeFirst();
            }
        } finally {
            lock.unlock();
        }
    }

    private int getMaxRetention() {
        AgentConfig config = AgentConfig.instance();
        if (config.getReport() != null) {
            return config.getReport().getMaxLogRetention();
        }
        return 1000;
    }
}
