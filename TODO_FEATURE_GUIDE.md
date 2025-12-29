# TODO 待办功能使用指南

## 功能概述

本项目基于 Socket.IO 实现了跨设备的 TODO 任务管理系统，支持两种使用模式：

### 模式 1：展板模式（Display Mode）
- **访问地址**：`http://<平板IP>:5173/` 或 `http://<服务端IP>:5173/`
- **用途**：展示任务列表，适合在平板/大屏设备上查看和勾选任务
- **特点**：
  - 以卡片形式展示任务，包含完整的任务信息（名称、简介、截止日期、标签）
  - 截止日期有颜色编码：
    - 🔴 已过期：红色
    - 🟠 今天：橙色
    - 🟡 3天内：黄色
    - 🟢 3天后：绿色
  - 标签以"胶囊"形式展示
  - 未完成的任务排在前面，已完成的任务排在后面
  - 实时接收其他设备派发的任务

### 模式 2：派发模式（Edit Mode）
- **访问地址**：`http://<服务端IP>:5173/?mode=edit`
- **用途**：专为手机/PC 优化的任务创建界面
- **特点**：
  - 顶部：完整的任务创建表单，包括：
    - **任务名称**（必填）
    - **简介**（可选，多行文本）
    - **截止日期**（可选，日期选择器）
    - **标签**（可选，支持多个标签）
  - 下方：实时任务列表，显示所有任务的完整信息
  - 支持在此页面勾选任务标记为完成
  - 新建的任务会立即出现在列表中，并同步到展板端

---

## 技术架构

### 数据结构

任务数据包含以下字段：

```typescript
type TodoItem = {
  id: string              // 唯一标识（时间戳）
  name: string            // 任务名称（必填）
  description?: string    // 简介（可选）
  deadline?: string       // 截止日期（可选，格式：YYYY-MM-DD）
  tags?: string[]         // 标签数组（可选）
  completed: boolean      // 完成状态
  createdAt: number       // 创建时间戳
}
```

### 通信协议

使用 Socket.IO 进行实时双向通信，事件如下：

| 事件名 | 发送方 | 接收方 | 数据 |
|-------|-------|-------|------|
| `initial-tasks` | 服务端 | 客户端 | `TodoItem[]` |
| `new-task` | 客户端 | 服务端 | `TodoItem` |
| `task-created` | 服务端 | 所有客户端 | `TodoItem` |
| `update-task` | 客户端 | 服务端 | `TodoItem` |
| `task-updated` | 服务端 | 所有客户端 | `TodoItem` |
| `delete-task` | 客户端 | 服务端 | `string` (任务ID) |
| `task-deleted` | 服务端 | 所有客户端 | `string` (任务ID) |

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
# 或
npm install
```

### 2. 启动 Socket.IO 服务端

在项目根目录运行：

```bash
npm run start-server
# 或直接运行：
node server/index.js
```

服务端默认监听 **port 3001**，确保同一局域网内的设备可访问。

### 3. 启动前端开发服务器

另开一个终端窗口，在项目根目录运行：

```bash
pnpm dev
# 或
npm run dev
```

前端默认运行在 **port 5173**。

### 4. 访问应用

**在平板/展板上**：
```
http://<你的机器IP>:5173/
```
例如：`http://192.168.3.7:5173/`

**在手机/PC 上创建任务**：
```
http://<同一服务器IP>:5173/?mode=edit
```
例如：`http://192.168.3.7:5173/?mode=edit`

---

## 使用示例

### 创建任务

1. 在手机/PC 浏览器打开派发模式：`http://192.168.3.7:5173/?mode=edit`
2. 填写表单：
   - **任务名称**（必填）：如 "完成周报"
   - **简介**（可选）：如 "需要整理本周的工作内容"
   - **截止日期**（可选）：如 2025-12-28
   - **标签**（可选）：如 "工作"、"紧急" 等
3. 点击 **发送任务** 按钮
4. 新任务会立即出现在派发端的任务列表中
5. 同时也会实时出现在平板的展板模式中（第四页，需向右滑动到达）

### 查看任务

1. 在平板上向右滑动到第四页（TODO 页面）
2. 查看所有任务的完整信息：
   - 任务名称醒目显示
   - 截止日期以"胶囊"形式展示，颜色表示紧急程度
   - 标签以紫色胶囊显示
   - 简介显示在任务名称下方

### 勾选任务（标记完成）

在任意端（展板或派发），点击任务左侧的复选框即可标记为完成，所有设备会实时同步。完成后的任务会：
- 显示删除线
- 透明度降低（更灰）
- 自动排序到列表下方
- 颜色调整为灰色系

### 删除任务

在任意端（展板或派发），将鼠标悬停在任务卡片上，右上角会显示 **🗑️ 删除按钮**：
- 点击删除按钮，确认删除后，任务会从所有设备的列表中彻底移除
- 删除操作会实时同步到局域网内的所有设备

---

## 配置与定制

### 修改服务端地址

如果你的 Socket.IO 服务端运行在其他地址或端口，修改文件：

**src/stores/todos.ts**（第 13 行左右）：

```typescript
const serverUrl = `${location.protocol}//${location.hostname}:3001`
```

改为你的服务端地址，例如：

```typescript
const serverUrl = 'http://192.168.3.100:3001'
// 或从环境变量读取：
const serverUrl = import.meta.env.VITE_SOCKET_URL || `${location.protocol}//${location.hostname}:3001`
```

### 修改服务端端口

在 **server/index.js** 中修改监听端口：

```javascript
const PORT = process.env.PORT || 3001  // 改为你想要的端口
```

### 持久化任务数据

当前实现将任务保存在 SQLite 数据库中，重启后会丢失。如需持久化，可改进 **server/index.js**：

**使用文件存储**：
```javascript
import fs from 'fs'

let tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8') || '[]')

function saveTasks() {
  fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2))
}

io.on('connection', (socket) => {
  socket.emit('initial-tasks', tasks)

  socket.on('new-task', (task) => {
    tasks.unshift(task)
    saveTasks()
    io.emit('task-created', task)
  })

  socket.on('update-task', (task) => {
    const idx = tasks.findIndex(t => t.id === task.id)
    if (idx !== -1) tasks[idx] = task
    saveTasks()
    io.emit('task-updated', task)
  })
})
```

---

## 生产部署

### 前端构建

```bash
npm run build
```

生成的静态文件在 `dist/` 目录中。

### 部署注意事项

1. **前端部署地址**：如部署到 `https://example.com/`
2. **服务端部署**：确保服务端与前端在同一域或配置 CORS 允许跨域
3. **修改 Socket.IO 连接地址**：在生产环境中，需要将 `src/stores/todos.ts` 中的 `serverUrl` 修改为指向生产环境的服务端地址
4. **数据库备份**：定期备份 `tasks.db` 数据库文件，详见 [SQLite 持久化指南](SQLITE_PERSISTENCE_GUIDE.md)

---

## 数据持久化

✅ **已集成 SQLite 数据库，数据自动持久化！**

- 任务数据存储在 `tasks.db` 数据库文件中
- 服务端启动时自动加载历史任务
- 无需额外配置，开箱即用
- 详细配置和管理指南见 [SQLite 持久化指南](SQLITE_PERSISTENCE_GUIDE.md)

---

## 常见问题

### Q1：为什么派发端看不到其他设备创建的任务？

**A**：确保：
1. Socket.IO 服务端正在运行（`npm run start-server`）
2. 所有设备连接到同一局域网
3. 服务端地址（`src/stores/todos.ts` 中的 `serverUrl`）配置正确

### Q2：任务在派发端创建后，为什么展板端看不到？

**A**：
1. 确认展板已打开到 TODO 页面（向右滑动到第四页）
2. 检查浏览器控制台是否有错误日志
3. 尝试刷新展板页面

### Q3：截止日期颜色是如何确定的？

**A**：在 [TodoView.vue](src/components/TodoView.vue) 中的 `getDeadlineClass()` 函数：
- **已过期**（days < 0）：红色 (`bg-red-600`)
- **今天**（days === 0）：橙色 (`bg-orange-600`)
- **3天内**（days <= 3）：黄色 (`bg-yellow-600`)
- **3天后**（days > 3）：绿色 (`bg-emerald-600`)

### Q4：如何修改样式？

**A**：修改 [TodoView.vue](src/components/TodoView.vue) 和 [TodoEdit.vue](src/components/TodoEdit.vue) 的 `<style>` 部分，或在模板中的 Tailwind 类中直接修改。

### Q5：如何自定义删除确认对话框？

**A**：在 [TodoView.vue](src/components/TodoView.vue) 或 [TodoEdit.vue](src/components/TodoEdit.vue) 的 `deleteTask()` 函数中修改确认提示：

```javascript
function deleteTask(id: string) {
  if (confirm('确认删除此任务？')) {  // 修改这里的文本
    todoStore.deleteTask(id)
  }
}
```

或使用更高级的 UI 确认弹窗库（如 `naive-ui`、`element-plus` 等）。

### Q6：完成状态的视觉表现如何定制？

**A**：在 [TodoView.vue](src/components/TodoView.vue) 中，任务卡片的 `:class` 绑定控制完成状态的样式：

```vue
:class="[
  'relative rounded-lg p-5 border-2 transition-all duration-300 group',
  t.completed 
    ? 'bg-gray-700 border-gray-500 opacity-50 hover:opacity-75'    // 修改这些类
    : 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
]"
```

---

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Socket.IO 服务端                       │
│                    (server/index.js, port 3001)              │
│                  [内存任务列表 or 数据库]                      │
└────────┬────────────────────────────────────┬────────────────┘
         │                                    │
    [new-task]                         [update-task]
    [task-created]                     [task-updated]
         │                                    │
         ▼                                    ▼
┌──────────────────┐              ┌──────────────────┐
│   派发端          │              │   展板端          │
│ (mode=edit)      │              │ (默认访问)        │
│                  │              │                  │
│ • 创建表单       │              │ • 展示卡片列表   │
│ • 任务列表       │              │ • 支持勾选完成   │
│                  │              │ • 实时同步       │
│ 手机 / PC        │              │ 平板 / 大屏      │
└──────────────────┘              └──────────────────┘
```

---

## 文件结构

```
clock-dashboard/
├── src/
│   ├── components/
│   │   ├── TodoView.vue        # 展板模式 - 任务显示卡片
│   │   └── TodoEdit.vue        # 派发模式 - 任务创建表单 + 列表
│   ├── stores/
│   │   └── todos.ts            # Pinia store, Socket.IO 客户端
│   └── App.vue                 # 主应用，路由模式逻辑
├── server/
│   └── index.js                # Socket.IO 服务端
├── package.json
└── README.md
```

---

## 许可证

MIT
