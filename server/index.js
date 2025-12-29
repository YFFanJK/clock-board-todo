import { createServer } from 'http'
import { Server } from 'socket.io'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
})

// Initialize SQLite Database
const dbPath = path.join(__dirname, '..', 'tasks.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err)
    process.exit(1)
  }
  console.log(`Database initialized at ${dbPath}`)
})

// Enable foreign keys and serialization mode
db.configure('busyTimeout', 5000)
db.run('PRAGMA foreign_keys = ON')

// Create tasks table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    tags TEXT,
    completed INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )
`)

// Load all tasks from database on startup
let tasks = []
let dbReady = false

function loadTasksFromDB() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks ORDER BY createdAt DESC', (err, rows) => {
      if (err) {
        console.error('Error loading tasks from database:', err)
        reject(err)
        return
      }
      
      tasks = (rows || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        deadline: row.deadline || undefined,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        completed: row.completed === 1,
        createdAt: row.createdAt
      }))
      
      console.log(`Loaded ${tasks.length} tasks from database`)
      dbReady = true
      resolve()
    })
  })
}

// Load tasks and start server
loadTasksFromDB()
  .catch(err => {
    console.error('Failed to load tasks:', err)
    process.exit(1)
  })

io.on('connection', (socket) => {
  console.log('client connected', socket.id)
  
  // send current tasks (only after DB is ready)
  if (dbReady) {
    socket.emit('initial-tasks', tasks)
  } else {
    // Wait for DB to be ready if still loading
    const checkInterval = setInterval(() => {
      if (dbReady) {
        clearInterval(checkInterval)
        socket.emit('initial-tasks', tasks)
      }
    }, 100)
  }

  socket.on('new-task', (task) => {
    const now = Date.now()
    
    // Insert into database
    db.run(
      `INSERT INTO tasks (id, name, description, deadline, tags, completed, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.name,
        task.description || null,
        task.deadline || null,
        task.tags ? JSON.stringify(task.tags) : null,
        0,
        task.createdAt,
        now
      ],
      (err) => {
        if (err) {
          console.error('Error creating task:', err)
          socket.emit('error', { message: 'Failed to create task' })
          return
        }
        
        console.log(`Task created: ${task.id}`)
        
        // Add to in-memory array
        tasks.unshift(task)
        
        // Broadcast to all clients
        io.emit('task-created', task)
      }
    )
  })

  socket.on('update-task', (task) => {
    const now = Date.now()
    
    // Update in database
    db.run(
      `UPDATE tasks 
       SET name = ?, description = ?, deadline = ?, tags = ?, completed = ?, updatedAt = ?
       WHERE id = ?`,
      [
        task.name,
        task.description || null,
        task.deadline || null,
        task.tags ? JSON.stringify(task.tags) : null,
        task.completed ? 1 : 0,
        now,
        task.id
      ],
      (err) => {
        if (err) {
          console.error('Error updating task:', err)
          socket.emit('error', { message: 'Failed to update task' })
          return
        }
        
        console.log(`Task updated: ${task.id}`)
        
        // Update in-memory array
        const idx = tasks.findIndex(t => t.id === task.id)
        if (idx !== -1) {
          tasks[idx] = task
        }
        
        // Broadcast to all clients
        io.emit('task-updated', task)
      }
    )
  })

  socket.on('delete-task', (id) => {
    // Delete from database
    db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting task:', err)
        socket.emit('error', { message: 'Failed to delete task' })
        return
      }
      
      console.log(`Task deleted: ${id}`)
      
      // Remove from in-memory array
      tasks = tasks.filter(t => t.id !== id)
      
      // Broadcast to all clients
      io.emit('task-deleted', id)
    })
  })

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Todo Socket.IO server listening on port ${PORT}`)
  console.log(`Database file: ${dbPath}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...')
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err)
    } else {
      console.log('Database closed')
    }
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...')
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err)
    } else {
      console.log('Database closed')
    }
    process.exit(0)
  })
})

