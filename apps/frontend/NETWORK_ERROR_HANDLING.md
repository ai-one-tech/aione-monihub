# 网络错误处理机制说明

## 概述

本项目实现了全局的网络错误处理机制，能够自动捕获和处理网络连接异常，并提供统一的重试功能。该机制适用于所有API请求，并能正确处理单个页面中的多个并发API请求。

## 核心组件

### 1. NetworkErrorProvider
全局上下文提供者，需要在应用根部包裹。

```tsx
// main.tsx
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NetworkErrorProvider>
        <App />
      </NetworkErrorProvider>
    </QueryClientProvider>
  </StrictMode>
)
```

### 2. useApiWithErrorHandler Hook
用于处理API调用的自定义Hook，自动集成网络错误处理。

```tsx
import { useApiWithErrorHandler } from '@/hooks/use-api-with-error-handler'

function MyComponent() {
  const { callApi, loading, data, error } = useApiWithErrorHandler<UserData>()
  
  const handleFetchData = async () => {
    await callApi(() => apiClient.get('/api/user/profile'))
  }
  
  // 组件渲染逻辑...
}
```

### 3. NetworkErrorDialog
全局网络错误弹窗组件，自动显示网络错误并提供重试功能。

## 使用方法

### 1. 基本API调用
```tsx
import { useApiWithErrorHandler } from '@/hooks/use-api-with-error-handler'
import { apiClient } from '@/lib/api-client'

function UserProfile() {
  const { callApi, loading, data, error } = useApiWithErrorHandler<UserProfile>()
  
  useEffect(() => {
    callApi(() => apiClient.get<UserProfile>('/api/user/profile'))
  }, [])
  
  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>
  if (!data) return <div>无数据</div>
  
  return <div>用户: {data.name}</div>
}
```

### 2. 处理多个并发API请求
```tsx
function Dashboard() {
  const { callApi: callUserApi, loading: userLoading } = useApiWithErrorHandler<UserData>()
  const { callApi: callStatsApi, loading: statsLoading } = useApiWithErrorHandler<StatsData>()
  
  const handleRefreshAll = async () => {
    // 并行调用多个API
    await Promise.all([
      callUserApi(() => apiClient.get<UserData>('/api/user/profile')),
      callStatsApi(() => apiClient.get<StatsData>('/api/dashboard/stats'))
    ])
  }
  
  return (
    <div>
      <button onClick={handleRefreshAll} disabled={userLoading || statsLoading}>
        刷新所有数据
      </button>
    </div>
  )
}
```

### 3. 在React Query中使用
React Query已经集成全局网络错误处理，无需额外配置：

```tsx
// queries会自动处理网络错误并显示全局弹窗
const { data, isLoading, error } = useQuery({
  queryKey: ['user'],
  queryFn: () => apiClient.get('/api/user').then(res => res.data)
})
```

## 重试机制

### 自动重试
- 网络错误弹窗提供重试按钮
- 支持单个或多个API请求的批量重试
- 内置重试次数限制（默认3次）

### 手动重试
```tsx
const { callApi, reset } = useApiWithErrorHandler()

const handleRetry = async () => {
  reset() // 重置状态
  await callApi(() => apiClient.get('/api/data'))
}
```

## 自定义配置

### 禁用全局网络错误处理
```tsx
// 在特定API调用中禁用全局网络错误处理
await callApi(
  () => apiClient.get('/api/data'),
  { disableNetworkErrorHandling: true }
)
```

### 自定义错误处理
```tsx
const { callApi } = useApiWithErrorHandler()

const handleApiCall = async () => {
  const result = await callApi(() => apiClient.get('/api/data'))
  
  if (!result) {
    // 处理网络错误（弹窗已自动显示）
    // 可以添加额外的错误处理逻辑
    console.log('网络请求失败')
  }
}
```

## 错误识别规则

网络错误识别基于以下条件：
1. Axios网络错误（无响应、超时等）
2. Fetch TypeError（Failed to fetch）
3. AbortError（请求中止/超时）
4. 包含"network"、"Network"、"timeout"、"Timeout"等关键词的错误消息

## 最佳实践

1. **优先使用useApiWithErrorHandler Hook**：对于手动API调用，推荐使用该Hook
2. **合理使用React Query**：对于数据获取，优先使用React Query，它已集成全局错误处理
3. **避免重复错误处理**：不要在组件中重复处理已由全局机制处理的网络错误
4. **及时清理**：在组件卸载时，使用reset()清理状态