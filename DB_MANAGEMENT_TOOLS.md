# 数据库管理工具

本文档提供一些有用的数据库管理脚本和工具，用于维护 SQLite 数据库。

---

## 📋 内置管理命令

### 检查数据库状态

创建 `server/db-cli.js`：

```javascript
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'tasks.db')

const db = new Database(dbPath)

// 获取统计信息
function getStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get()
  const completed = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 1').get()
  const pending = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 0').get()
  
  console.log('\n📊 数据库统计：')
  console.log(`总任务数：${total.count}`)
  console.log(`已完成：${completed.count}`)
  console.log(`待处理：${pending.count}`)
}

// 显示所有任务
function listAll() {
  const tasks = db.prepare('SELECT id, name, completed, deadline FROM tasks ORDER BY createdAt DESC').all()
  console.log('\n📝 所有任务：')
  tasks.forEach((task, idx) => {
    const status = task.completed ? '✓' : '○'
    const deadline = task.deadline ? ` [${task.deadline}]` : ''
    console.log(`${idx + 1}. ${status} ${task.name}${deadline}`)
  })
}

// 导出为 JSON
function exportJSON(outputFile = 'tasks_export.json') {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all()
  const fs = require('fs')
  const data = tasks.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    deadline: row.deadline,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    completed: row.completed === 1,
    createdAt: row.createdAt
  }))
  
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2))
  console.log(`✅ 导出成功: ${outputFile}`)
}

// 清除所有任务（需确认）
function clearAll() {
  const confirm = process.argv[2] === '--force'
  if (!confirm) {
    console.log('⚠️  这会删除所有任务！使用 --force 确认')
    return
  }
  
  db.prepare('DELETE FROM tasks').run()
  console.log('✅ 所有任务已清除')
}

// 数据库维护
function vacuum() {
  db.exec('VACUUM')
  console.log('✅ 数据库压缩完成')
}

// 命令行接口
const command = process.argv[2]
switch (command) {
  case 'stats':
    getStats()
    break
  case 'list':
    listAll()
    break
  case 'export':
    exportJSON(process.argv[3])
    break
  case 'clear':
    clearAll()
    break
  case 'vacuum':
    vacuum()
    break
  default:
    console.log(`
使用方法: node server/db-cli.js <command>

命令：
  stats         - 显示数据库统计信息
  list          - 列出所有任务
  export [file] - 导出任务为 JSON 文件
  clear --force - 清除所有任务（需确认）
  vacuum        - 压缩数据库文件
    `)
}

db.close()
```

### 使用数据库管理工具

```bash
# 查看统计信息
node server/db-cli.js stats

# 列出所有任务
node server/db-cli.js list

# 导出为 JSON
node server/db-cli.js export
node server/db-cli.js export my_tasks.json

# 清除所有任务（需确认）
node server/db-cli.js clear --force

# 压缩数据库
node server/db-cli.js vacuum
```

---

## 🔄 导入/导出工具

### 从 JSON 导入任务

创建 `server/db-import.js`：

```javascript
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'tasks.db')

const inputFile = process.argv[2]
if (!inputFile) {
  console.log('使用方法: node server/db-import.js <file.json>')
  process.exit(1)
}

if (!fs.existsSync(inputFile)) {
  console.log(`❌ 文件不存在: ${inputFile}`)
  process.exit(1)
}

const db = new Database(dbPath)
const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'))

console.log(`📥 导入 ${data.length} 个任务...`)

const stmt = db.prepare(`
  INSERT OR REPLACE INTO tasks (id, name, description, deadline, tags, completed, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

let imported = 0
for (const task of data) {
  try {
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
    imported++
  } catch (err) {
    console.error(`❌ 导入失败: ${task.id} - ${err.message}`)
  }
}

console.log(`✅ 成功导入 ${imported} 个任务`)
db.close()
```

### 使用导入工具

```bash
# 导入任务
node server/db-import.js tasks_export.json
```

---

## 🛠️ 备份和恢复

### 自动备份脚本

创建 `server/db-backup.js`：

```javascript
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'tasks.db')
const backupDir = path.join(__dirname, '..', 'backups')

// 创建备份目录
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// 创建备份
function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const backupFile = path.join(backupDir, `tasks_${timestamp}.db`)
  
  // 检查是否已有当日备份
  if (fs.existsSync(backupFile)) {
    console.log(`✅ 当日备份已存在: ${backupFile}`)
    return
  }
  
  fs.copyFileSync(dbPath, backupFile)
  console.log(`✅ 备份成功: ${backupFile}`)
  
  // 清理 7 天前的备份
  const files = fs.readdirSync(backupDir)
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  
  files.forEach(file => {
    const filePath = path.join(backupDir, file)
    const stat = fs.statSync(filePath)
    if (now - stat.mtime.getTime() > sevenDaysMs) {
      fs.unlinkSync(filePath)
      console.log(`🗑️  删除旧备份: ${file}`)
    }
  })
}

// 恢复备份
function restore(backupFile) {
  const backupPath = path.join(backupDir, backupFile)
  
  if (!fs.existsSync(backupPath)) {
    console.log(`❌ 备份文件不存在: ${backupPath}`)
    process.exit(1)
  }
  
  // 关闭当前数据库
  const db = new Database(dbPath)
  db.close()
  
  // 创建当前数据库的备份
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.copyFileSync(dbPath, path.join(backupDir, `tasks_recovery_${timestamp}.db`))
  
  // 恢复备份
  fs.copyFileSync(backupPath, dbPath)
  console.log(`✅ 恢复成功: ${backupFile}`)
}

const command = process.argv[2]
if (command === 'restore') {
  const backupFile = process.argv[3]
  if (!backupFile) {
    console.log('使用方法: node server/db-backup.js restore <backup_file>')
    process.exit(1)
  }
  restore(backupFile)
} else {
  backup()
}
```

### 使用备份工具

```bash
# 创建备份
node server/db-backup.js

# 恢复备份
node server/db-backup.js restore tasks_2025-12-28.db

# 定时备份（每天凌晨 2 点）
# 在 crontab 中添加：
# 0 2 * * * cd /path/to/clock-dashboard && node server/db-backup.js
```

---

## 🔍 调试工具

### 数据库检查工具

创建 `server/db-check.js`：

```javascript
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'tasks.db')

console.log('🔍 数据库检查...\n')

// 检查文件存在
if (!fs.existsSync(dbPath)) {
  console.log('❌ 数据库文件不存在')
  process.exit(1)
}

const stat = fs.statSync(dbPath)
console.log(`✅ 数据库文件存在`)
console.log(`   大小: ${(stat.size / 1024).toFixed(2)} KB`)
console.log(`   创建时间: ${stat.birthtime}`)
console.log(`   修改时间: ${stat.mtime}\n`)

try {
  const db = new Database(dbPath)
  
  // 检查表存在
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table'
  `).all()
  
  console.log(`✅ 表数量: ${tables.length}`)
  tables.forEach(table => {
    console.log(`   - ${table.name}`)
  })
  console.log()
  
  // 检查索引
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='index'
  `).all()
  
  console.log(`✅ 索引数量: ${indexes.length}`)
  indexes.forEach(index => {
    console.log(`   - ${index.name}`)
  })
  console.log()
  
  // 检查数据完整性
  const integrity = db.prepare('PRAGMA integrity_check').get()
  if (integrity.integrity_check === 'ok') {
    console.log('✅ 数据完整性检查: 通过')
  } else {
    console.log(`⚠️  数据完整性检查: ${integrity.integrity_check}`)
  }
  
  db.close()
} catch (err) {
  console.log(`❌ 数据库错误: ${err.message}`)
  process.exit(1)
}
```

### 使用检查工具

```bash
# 检查数据库
node server/db-check.js
```

---

## 📊 生产环境建议

### 1. 设置定时备份

```bash
# Linux/macOS crontab
0 2 * * * /usr/local/bin/node /app/server/db-backup.js >> /var/log/tasks-backup.log 2>&1
```

### 2. 监控数据库大小

```bash
# 创建 monitoring.js
const db = new Database(dbPath)
const stat = fs.statSync(dbPath)
const sizeInMB = stat.size / (1024 * 1024)

if (sizeInMB > 100) {
  console.warn('⚠️  数据库接近限制，考虑存档')
}

db.exec('VACUUM')  // 定期压缩
```

### 3. 启用 WAL 模式

在 `server/index.js` 中：

```javascript
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')  // 提高性能
```

---

## 🆘 故障恢复

### 数据库损坏

```bash
# 检查
sqlite3 tasks.db "PRAGMA integrity_check;"

# 修复
sqlite3 tasks.db "VACUUM;"

# 或恢复备份
node server/db-backup.js restore <backup_file>
```

### 磁盘空间不足

```bash
# 压缩数据库
node server/db-cli.js vacuum

# 导出为 JSON 并清除
node server/db-cli.js export tasks_archive.json
node server/db-cli.js clear --force
```

---

## 许可证

MIT
