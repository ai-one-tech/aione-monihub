# aione-monihub

AiOne MoniHub 是由 AiOne 团队精心打造的一款集成化监控和管理平台，旨在为用户提供高效、便捷的远程应用管理解决方案。无论是通过 PC 还是移动设备，用户都可以轻松访问和操作平台，确保部署的应用始终处于最佳状态。

## 项目结构

```
aione-monihub/
├── README.md
├── LICENSE
├── Cargo.toml                    # Rust 工作区配置
├── package.json                  # 前端项目配置
├── apps/
│   ├── server/                   # Rust 服务端
│   │   ├── api/                  # REST API 服务
│   │   ├── websocket/            # WebSocket 服务
│   │   └── Cargo.toml
│   ├── frontend/                 # PC 前端
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   │   ├── components/       # UI 组件
│   │   │   ├── pages/            # 页面组件
│   │   │   ├── hooks/            # 自定义 hooks
│   │   │   ├── lib/              # 工具库
│   │   │   └── App.tsx
│   │   └── public/
│   └── agent/                    # 代理端
│       ├── java/                 # Java 代理 (Spring Boot)
│       │   ├── pom.xml
│       │   └── src/
│       └── js/                   # JavaScript 代理
│           ├── package.json
│           └── src/
├── packages/                     # 共享包
│   ├── config/                   # 配置文件
│   ├── ui/                       # 共享 UI 组件
│   └── types/                    # 共享类型定义
├── docs/                         # 文档
└── docker/                       # Docker 配置
```

## 技术栈

- 后端：Rust + Actix Web
- 前端：React + TypeScript + Vite + Shadcn UI + Tailwind CSS
- 代理端：Java (Spring Boot) + JavaScript

## 快速开始

### 后端服务
```bash
cd apps/server
cargo run
```

### 前端应用
```bash
cd apps/frontend
npm install
npm run dev
```

### JavaScript 代理
```bash
cd apps/agent/js
npm install
npm start
```
