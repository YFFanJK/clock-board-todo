# 快速参考卡片

## 🚀 快速启动

### 第一次使用
```bash
# 1. 安装依赖
pnpm install

# 2. 启动 Socket.IO 服务端（终端 1）
npm run start-server

# 3. 启动前端开发服务器（终端 2）
pnpm dev
```

### 访问应用
```
展板端（平板）：  http://localhost:5173/
派发端（手机/PC）：http://localhost:5173/?mode=edit
```

---

## 📱 两种模式详解

| 模式 | 访问方式 | 用途 | 特点 |
|-----|---------|------|------|
| **展板模式** | `/` | 平板/大屏查看任务 | 卡片式展示，大字体，优先显示未完成任务 |
| **派发模式** | `/?mode=edit` | 手机/PC 快速创建任务 | 表单输入，任务列表，适合小屏输入 |

---

## ✍️ 创建任务

**展板模式**：无法创建（仅查看和勾选）

**派发模式**：
1. 填写 **任务名称**（必填）
2. 填写 **简介**（可选）
3. 选择 **截止日期**（可选）
4. 添加 **标签**（可选，可多个）
5. 点击 **发送任务**

---

## ✅ 标记完成

**操作**：点击任务左/右的 **☑️ 复选框**

**效果**：
- ✅ 任务名称显示删除线
- ✅ 背景变灰，透明度降低
- ✅ 自动排序到列表底部
- ✅ 所有设备实时同步

---

## 🗑️ 删除任务

**操作**：
1. 将鼠标悬停在任务上
2. 点击右上角的 **🗑️ 删除按钮**
3. 确认删除

**效果**：
- 🗑️ 任务从所有设备同时移除
- 🗑️ 列表实时刷新（无需手动刷新）

---

## 🎨 截止日期颜色

| 颜色 | 日期范围 | 含义 |
|-----|---------|------|
| 🔴 红色 | 已过期 | 紧急！已错过截止日期 |
| 🟠 橙色 | 今天 | 需要今天完成 |
| 🟡 黄色 | 1-3 天内 | 近期需要完成 |
| 🟢 绿色 | 3 天后 | 有充足时间 |

---

## �️ 数据库和持久化

### 数据存储位置

```
clock-dashboard/
└── tasks.db          # SQLite 数据库（自动创建）
```

### 重要功能

- ✅ **自动持久化**：所有任务自动保存到 SQLite 数据库
- ✅ **启动恢复**：服务端启动时自动加载历史任务
- ✅ **零配置**：无需手动配置，开箱即用

### 常见数据库操作

```bash
# 查看所有任务
sqlite3 tasks.db "SELECT id, name, completed FROM tasks;"

# 查看任务总数
sqlite3 tasks.db "SELECT COUNT(*) FROM tasks;"

# 备份数据库
cp tasks.db tasks.db.backup

# 恢复备份
cp tasks.db.backup tasks.db
```

### 详细数据库指南

参见 [SQLite 持久化指南](SQLITE_PERSISTENCE_GUIDE.md)

---

## 🔌 Socket.IO 事件速查

### 创建任务
```
客户端 ──[new-task]──> 服务端
              ↓
         INSERT INTO 数据库
              ↓
         广播给所有客户端
              ↓
服务端 ──[task-created]──> 所有客户端
```

### 更新/完成任务
```
客户端 ──[update-task]──> 服务端
               ↓
         UPDATE 数据库
               ↓
          广播给所有客户端
               ↓
服务端 ──[task-updated]──> 所有客户端
```

### 删除任务
```
客户端 ──[delete-task]──> 服务端
             ↓
         DELETE FROM 数据库
             ↓
        广播给所有客户端
             ↓
服务端 ──[task-deleted]──> 所有客户端
```

---

## 🐛 常见问题速查

| 问题 | 解决方案 |
|------|--------|
| 派发端看不到新建任务 | 检查展板是否打开到 TODO 页面（向右滑动到第四页） |
| 删除按钮不显示 | 将鼠标悬停在任务上，或者尝试刷新页面 |
| 跨设备不同步 | 检查 Socket.IO 服务端是否运行，检查防火墙 3001 端口 |
| 任务在重启后丢失 | ✅ 现在会自动保存！检查 `tasks.db` 文件是否存在 |

---

## ⚙️ 配置修改

### 修改服务端端口
文件：`server/index.js`
```javascript
const PORT = process.env.PORT || 3001  // 改成你想要的端口
```

### 修改 Socket.IO 地址
文件：`src/stores/todos.ts`
```typescript
const serverUrl = `${location.protocol}//${location.hostname}:3001`
// 改为你的服务端地址，例如：
// const serverUrl = 'http://192.168.1.100:3001'
```

### 修改样式
文件：`src/components/TodoView.vue` / `src/components/TodoEdit.vue`
- 卡片颜色：修改 Tailwind 类（如 `bg-blue-900`）
- 字体大小：修改 `text-xl`、`text-lg` 等
- 边距/间距：修改 `p-5`、`gap-2` 等

---

## 📊 数据结构

```typescript
type TodoItem = {
  id: string              // 唯一标识（时间戳）
  name: string            // 任务名称
  description?: string    // 简介
  deadline?: string       // 截止日期 (YYYY-MM-DD)
  tags?: string[]         // 标签数组
  completed: boolean      // 是否完成
  createdAt: number       // 创建时间戳 (ms)
}
```

---

## 📁 核心文件地图

```
src/
├── components/
│   ├── TodoView.vue      # 展板模式 UI
│   └── TodoEdit.vue      # 派发模式 UI
├── stores/
│   └── todos.ts          # Pinia store + Socket.IO 客户端
└── App.vue               # 主应用入口
server/
└── index.js              # Socket.IO 服务端
```

---

## 🎯 使用建议

### 展板端使用场景
- 在会议室大屏查看团队任务进度
- 在办公室墙上挂显示屏实时显示待办
- 在家里观看个人任务清单

### 派发端使用场景
- 下班路上用手机快速新建任务
- 在电脑上填写详细信息
- 随时随地标记任务完成

---

## ✨ 高级技巧

### 快速提交任务（派发端）
- 在任务名称框输入后直接按 **Enter** 键提交
- 在标签框输入后按 **Enter** 自动添加标签

### 快速删除确认
- 删除时会弹出确认对话框，确认即可
- 无法撤销删除，请谨慎操作

### 批量查看任务
- 展板端支持 2 列网格布局（宽屏自动）
- 派发端支持滚动查看所有任务

---

## 📞 获取帮助

1. **查看完整文档**：[TODO_FEATURE_GUIDE.md](TODO_FEATURE_GUIDE.md)
2. **查看测试清单**：[TODO_TEST_CHECKLIST.md](TODO_TEST_CHECKLIST.md)
3. **查看版本历史**：[CHANGELOG_v1.1.0.md](CHANGELOG_v1.1.0.md)
4. **查看源代码注释**：各文件中的 `//` 和 `<!--` 注释

---

**最后更新**：2025-12-28  
**版本**：v1.1.0
