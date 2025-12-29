import { defineStore } from 'pinia'
import { ref, onBeforeUnmount } from 'vue'
import { io, type Socket } from 'socket.io-client'

export type TodoItem = {
  id: string
  name: string
  description?: string
  deadline?: string
  tags?: string[]
  completed: boolean
  createdAt: number
}

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<TodoItem[]>([])

  const serverUrl = `${location.protocol}//${location.hostname}:3001`
  const socket: Socket = io(serverUrl)

  socket.on('initial-tasks', (data: TodoItem[]) => {
    todos.value = data || []
  })

  socket.on('task-created', (task: TodoItem) => {
    // keep newest on top
    todos.value = [task, ...todos.value.filter(t => t.id !== task.id)]
  })

  socket.on('task-updated', (task: TodoItem) => {
    const idx = todos.value.findIndex(t => t.id === task.id)
    if (idx >= 0) todos.value[idx] = task
  })

  socket.on('task-deleted', (id: string) => {
    todos.value = todos.value.filter(t => t.id !== id)
  })

  function addTask(name: string, description?: string, deadline?: string, tags?: string[]) {
    const task: TodoItem = { 
      id: Date.now().toString(), 
      name, 
      description, 
      deadline, 
      tags, 
      completed: false, 
      createdAt: Date.now() 
    }
    socket.emit('new-task', task)
  }

  function toggleTask(id: string) {
    const task = todos.value.find(t => t.id === id)
    if (!task) return
    const updated = { ...task, completed: !task.completed }
    socket.emit('update-task', updated)
  }

  function deleteTask(id: string) {
    socket.emit('delete-task', id)
  }

  onBeforeUnmount(() => {
    socket.disconnect()
  })

  return { todos, addTask, toggleTask, deleteTask }
})
