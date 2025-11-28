## 目标
- 将“输出数据”替换为可切换的标签：`Raw` 与 `Table`
- 默认 `Raw`，沿用当前 `pre` 方式渲染 JSON；切换到 `Table` 后，下方以表格展示 JSON 内容
- 多层结构以“标题缩进”的形式分层展示

## 位置与现状
- 修改文件：`apps/frontend/src/features/application-tasks/execution-result.tsx`
- 现有输出头部位置：`execution-result.tsx:61-74`（标题“输出数据:”与复制按钮）
- 现有原始渲染：`execution-result.tsx:75-79` 使用 `renderPre(...)` 输出 JSON

## 技术实现
- 引入组件：`Tabs, TabsList, TabsTrigger, TabsContent`（`apps/frontend/src/components/ui/tabs.tsx`），`Table` 系列（`apps/frontend/src/components/ui/table.tsx`）
- 在原“输出数据”头部处放置 `Tabs`，`TabsList` 内含 `Raw` 与 `Table` 两个 `TabsTrigger`，右侧保留复制按钮
- `Tabs` 默认值为 `raw`；`TabsContent value="raw"` 保持原 `renderPre(...)` 输出
- 新增 `TabsContent value="table"`，渲染 `JsonTableView` 组件以表格方式展示 JSON

## 渲染规则（JsonTableView）
- 使用两列表头：`字段`、`值`
- 基本行：`key`（含缩进）+ `value`
- 对象/数组采用“标题缩进”分层：
  - 渲染一行“分组标题”，`TableCell` 跨两列，文本加粗并根据层级增加左内边距（如 `pl-0/4/8/...`）
  - 递归渲染其子项；对象子项以 `key` 展示；数组子项以索引 `[0]`、`[1]` 展示
- 原始类型（string/number/boolean/null）直接在一行展示
- 最顶层为对象/数组时，不显示“root”标题，仅展示其子项
- 大体量数据保持滚动容器，复用现有 `ScrollArea`

## 交互细节
- 复制按钮行为不变：始终复制原始 JSON 文本
- 标签切换仅影响下方内容区域；保持整体布局与样式一致（shadcn 风格）
- 空数据或非对象/数组时：`Table` 显示单行，无报错

## 兼容性与边界
- 保持成功、失败、其他状态区块结构不变，仅在“成功”且有 `result_data` 时启用标签
- 深层嵌套通过缩进层级展示，不做可折叠交互（后续可扩展）

## 变更文件
- `apps/frontend/src/features/application-tasks/execution-result.tsx`：
  - 替换标题区为 Tabs + 复制按钮
  - 保留 `Raw` 区使用现有 `renderPre`
  - 新增 `JsonTableView` 递归渲染函数并引入 `Table` 系列组件
