# SQLite 数据库集成指南

## 概述

本项目已集成 **SQLite 3** 数据库，用于持久化存储 TODO 任务数据。重启服务端后，所有历史任务都会被自动加载。

---

## 快速开始

### 1️⃣ 安装依赖

```bash
pnpm install
# 或
npm install
```

这会自动安装 `better-sqlite3` 及其他依赖。

### 2️⃣ 启动服务端

```bash
npm run start-server
```

**首次启动时**：
- 服务端会自动在项目根目录创建 `tasks.db` 文件
- 自动创建 `tasks` 表
- 输出初始化日志

**后续启动时**：
- 自动加载数据库中的所有历史任务
- 客户端连接时立即收到任务列表

---

## 数据库架构

### 数据库文件

```
clock-dashboard/
└── tasks.db          # SQLite 数据库文件（自动创建）
```

### 表结构：tasks

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,              -- 唯一标识（客户端生成，时间戳）
  name TEXT NOT NULL,               -- 任务名称
  description TEXT,                 -- 简介
  deadline TEXT,                    -- 截止日期（YYYY-MM-DD）
  tags TEXT,                        -- 标签（JSON 字符串数组）
  completed INTEGER DEFAULT 0,      -- 完成状态（0=未完成，1=已完成）
  createdAt INTEGER NOT NULL,       -- 创建时间戳（毫秒）
  updatedAt INTEGER NOT NULL        -- 最后修改时间戳（毫秒）
)
```

### 数据示例

```json
{
  "id": "1735449600000",
  "name": "完成周报",
  "description": "需要整理本周的工作内容",
  "deadline": "2025-12-28",
  "tags": ["工作", "紧急"],
  "completed": 0,
  "createdAt": 1735449600000,
  "updatedAt": 1735449600000
}
```

---

## 数据库操作流程

### 创建任务

```
客户端 ──[new-task]──> 服务端
                ↓
          INSERT INTO tasks
                ↓
         更新内存数组
                ↓
  广播 [task-created] 给所有客户端
```

**SQL 执行**：
```sql
INSERT INTO tasks (id, name, description, deadline, tags, completed, createdAt, updatedAt)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

### 更新任务

```
客户端 ──[update-task]──> 服务端
              ↓
        UPDATE tasks
              ↓
       更新内存数组
              ↓
  广播 [task-updated] 给所有客户端
```

**SQL 执行**：
```sql
UPDATE tasks 
SET name = ?, description = ?, deadline = ?, tags = ?, completed = ?, updatedAt = ?
WHERE id = ?
```

### 删除任务

```
客户端 ──[delete-task]──> 服务端
            ↓
      DELETE FROM tasks
            ↓
     更新内存数组
            ↓
  广播 [task-deleted] 给所有客户端
```

**SQL 执行**：
```sql
DELETE FROM tasks WHERE id = ?
```

---

## 服务端启动流程

```
1. 连接数据库 → tasks.db
2. 创建表（如果不存在）→ CREATE TABLE IF NOT EXISTS
3. 从数据库加载所有任务 → SELECT * FROM tasks
4. 启动 Socket.IO 服务端
5. 客户端连接 → 立即发送历史任务列表
```

**日志示例**：
```
Database initialized at /path/to/tasks.db
Loaded 5 tasks from database
Todo Socket.IO server listening on port 3001
Database file: /path/to/tasks.db
```

---

## 前端无需修改

✅ **完全向后兼容**

前端代码（`src/stores/todos.ts`）无需任何修改：
- Socket.IO 事件保持不变
- 任务数据结构保持不变
- 只是后端的存储位置从"内存"改为"SQLite 数据库"

---

## 常见操作

### 查看数据库文件大小

```bash
# Windows
dir tasks.db

# macOS / Linux
ls -lh tasks.db
```

### 手动备份数据库

```bash
# 简单复制
cp tasks.db tasks.db.backup

# 或导出为 SQL
sqlite3 tasks.db ".dump" > tasks_backup.sql
```

### 恢复数据库备份

```bash
# 从备份恢复
cp tasks.db.backup tasks.db

# 或从 SQL 恢复
sqlite3 tasks.db < tasks_backup.sql
```

### 查询数据库内容

```bash
# 安装 sqlite3 命令行工具（如果没有）
# Windows: 下载 sqlite3.exe
# macOS: brew install sqlite
# Linux: apt-get install sqlite3

# 查看所有任务
sqlite3 tasks.db "SELECT id, name, completed, deadline FROM tasks;"

# 查看任务总数
sqlite3 tasks.db "SELECT COUNT(*) as total FROM tasks;"

# 查看已完成任务
sqlite3 tasks.db "SELECT * FROM tasks WHERE completed = 1;"

# 查看待完成任务
sqlite3 tasks.db "SELECT * FROM tasks WHERE completed = 0;"

# 导出为 CSV
sqlite3 tasks.db ".mode csv" ".output tasks.csv" "SELECT * FROM tasks;" ".quit"

# 导出为 JSON（需要查询工具）
sqlite3 tasks.db "SELECT json_group_object(id, json_object('name', name, 'completed', completed)) FROM tasks;" > tasks.json
```

---

## 性能优化

### 1️⃣ 索引优化

当任务数量增多时，可以添加索引以加快查询：

```sql
-- 按完成状态查询快速化
CREATE INDEX idx_completed ON tasks(completed);

-- 按创建时间查询快速化
CREATE INDEX idx_createdAt ON tasks(createdAt);

-- 组合索引
CREATE INDEX idx_completed_createdAt ON tasks(completed, createdAt DESC);
```

### 2️⃣ 连接池（可选）

对于高并发场景，考虑使用连接池，但 SQLite 本身是单进程的，不需要额外配置。

### 3️⃣ WAL 模式

启用 Write-Ahead Logging (WAL) 以提高并发性能：

在 `server/index.js` 中添加：
```javascript
db.pragma('journal_mode = WAL')
```

---

## 错误处理

所有数据库操作都有 try-catch 错误处理：

```javascript
try {
  // 数据库操作
  stmt.run(...)
} catch (err) {
  console.error('Error:', err)
  socket.emit('error', { message: '操作失败' })
}
```

**常见错误**：

| 错误 | 原因 | 解决方案 |
|------|------|--------|
| `SQLITE_CANTOPEN` | 无法打开数据库文件 | 检查文件权限和磁盘空间 |
| `SQLITE_CONSTRAINT` | 唯一性约束冲突 | 检查任务 ID 是否重复 |
| `SQLITE_IOERR` | 磁盘 I/O 错误 | 检查磁盘健康状况 |

---

## 迁移指南

### 从纯内存版本升级

如果之前使用的是纯内存版本（无数据库），升级后：

1. ✅ 所有新任务会自动保存到数据库
2. ✅ 旧的内存任务会丢失（如需保留，请手动迁移）

**手动迁移方案**（如有旧任务需保留）：

```javascript
// 在 server/index.js 中，加载历史任务后添加这段代码：
const oldTasks = [
  // 粘贴旧任务数据
  { id: '...', name: '...', ...}
]

for (const task of oldTasks) {
  const stmt = db.prepare(`
    INSERT INTO tasks (id, name, description, deadline, tags, completed, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(...)
}
```

---

## 数据导入/导出

### 导出任务为 JSON

```javascript
// 在服务端添加一个 API 端点或 Socket.IO 事件
socket.on('export-tasks', () => {
  const stmt = db.prepare('SELECT * FROM tasks')
  const data = stmt.all()
  socket.emit('tasks-export', JSON.stringify(data, null, 2))
})
```

### 导入 JSON 任务

```javascript
socket.on('import-tasks', (jsonData) => {
  try {
    const importedTasks = JSON.parse(jsonData)
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tasks (id, name, description, deadline, tags, completed, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const task of importedTasks) {
      stmt.run(
        task.id,
        task.name,
        task.description || null,
        task.deadline || null,
        task.tags ? JSON.stringify(task.tags) : null,
        task.completed ? 1 : 0,
        task.createdAt,
        task.updatedAt || Date.now()
      )
    }
    
    loadTasksFromDB()  // 重新加载内存
    io.emit('initial-tasks', tasks)  // 通知所有客户端
    socket.emit('import-success', { count: importedTasks.length })
  } catch (err) {
    socket.emit('error', { message: '导入失败' })
  }
})
```

---

## 安全注意事项

### 1️⃣ SQL 注入防护

✅ 已使用参数化查询，防止 SQL 注入：

```javascript
const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?')
stmt.run(userProvidedId)  // 参数分离，安全
```

❌ 不要使用字符串拼接：

```javascript
// 危险！不要这样做
db.exec(`SELECT * FROM tasks WHERE id = '${userProvidedId}'`)
```

### 2️⃣ 文件权限

确保 `tasks.db` 有适当的读写权限：

```bash
# macOS / Linux
chmod 644 tasks.db

# Windows 使用文件属性设置
```

### 3️⃣ 访问控制

生产环境建议：
- 限制服务端 IP 访问
- 使用防火墙规则
- 添加身份验证

---

## 生产部署

### 部署前检查清单

- [x] 安装 `better-sqlite3`：`npm install`
- [x] 测试数据库初始化：`npm run start-server`
- [x] 验证数据持久化：重启后检查任务是否保留
- [x] 设置数据库备份计划
- [x] 监控磁盘空间
- [x] 配置日志记录

### 备份策略

**定期备份**：
```bash
# 每日备份脚本（Linux/macOS）
#!/bin/bash
cp tasks.db tasks.db.$(date +%Y%m%d_%H%M%S)

# 保留最近 7 天的备份
find . -name "tasks.db.*" -mtime +7 -delete
```

**自动备份**（在 Node.js 中）：
```javascript
import fs from 'fs'
import path from 'path'

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(__dirname, '..', `tasks.db.${timestamp}`)
  fs.copyFileSync(path.join(__dirname, '..', 'tasks.db'), backupPath)
  console.log(`Database backed up to ${backupPath}`)
}

// 每小时备份一次
setInterval(backupDatabase, 60 * 60 * 1000)
```

---

## 故障排除

### 问题 1：无法安装 better-sqlite3

**症状**：`npm install` 报错，找不到编译工具

**解决方案**：
```bash
# macOS
xcode-select --install

# Windows: 需要安装 Visual Studio Build Tools
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Linux (Ubuntu/Debian)
sudo apt-get install build-essential python3

# 然后重新安装
npm install
```

### 问题 2：任务丢失

**症状**：重启后任务消失

**检查步骤**：
1. 检查 `tasks.db` 文件是否存在
2. 检查服务端日志是否有错误
3. 使用 `sqlite3` 命令行查看数据库内容
4. 检查数据库文件权限

### 问题 3：数据库被锁定

**症状**：`database is locked` 错误

**原因**：多个进程同时访问数据库

**解决方案**：
1. 确保只有一个服务端实例运行
2. 重启服务端释放锁
3. 启用 WAL 模式改进并发处理

### 问题 4：性能下降

**症状**：任务数量增加后，操作变慢

**解决方案**：
1. 添加索引（见性能优化部分）
2. 定期清理已删除任务（如有）
3. 使用 VACUUM 命令压缩数据库：
   ```javascript
   db.exec('VACUUM')
   ```

---

## 版本历史

| 版本 | 日期 | 改动 |
|------|------|------|
| v1.2.0 | 2025-12-28 | 集成 SQLite 数据库实现持久化 |
| v1.1.0 | 2025-12-28 | 新增删除功能和完成状态优化 |
| v1.0.0 | 2025-12-28 | 初始发布，内存存储 |

---

## 相关文档

- [TODO 功能指南](TODO_FEATURE_GUIDE.md)
- [快速参考](QUICK_REFERENCE.md)
- [测试清单](TODO_TEST_CHECKLIST.md)

---

## 许可证

MIT
