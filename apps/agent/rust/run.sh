#!/bin/bash

# 启动 Rust Agent 并过滤系统日志
./target/debug/monihub-agent-rs "$@" 2>&1 | grep -v "CacheDelete" | grep -v "FileIDMap"
