<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTodoStore } from '../stores/todos'
import { computed } from 'vue'

const todoStore = useTodoStore()
const { todos } = storeToRefs(todoStore)

function toggle(id: string) {
  todoStore.toggleTask(id)
}

function deleteTask(id: string) {
  if (confirm('确认删除此任务？')) {
    todoStore.deleteTask(id)
  }
}

// 计算距离截止日期的天数，用于视觉优先级
function daysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDeadlineClass(deadline?: string) {
  const days = daysUntilDeadline(deadline)
  if (days === null) return ''
  if (days < 0) return 'bg-red-600 text-white'
  if (days === 0) return 'bg-orange-600 text-white'
  if (days <= 3) return 'bg-yellow-600 text-white'
  return 'bg-emerald-600 text-white'
}

function formatDeadline(deadline?: string): string {
  if (!deadline) return ''
  const d = new Date(deadline)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 按完成状态分组：未完成的在前
const groupedTodos = computed(() => {
  const incomplete = todos.value.filter(t => !t.completed)
  const complete = todos.value.filter(t => t.completed)
  return [...incomplete, ...complete]
})
</script>

<template>
  <div class="w-full h-full p-6 bg-black text-white flex flex-col">
    <h2 class="text-4xl font-bold mb-6">待办</h2>
    
    <div class="overflow-auto flex-1">
      <div v-if="todos.length === 0" class="text-center text-gray-400 py-12">
        <div class="text-2xl mb-2">📋</div>
        <div>暂无任务</div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="t in groupedTodos"
          :key="t.id"
          :class="[
            'relative rounded-lg p-5 border-2 transition-all duration-300 group',
            t.completed 
              ? 'bg-gray-700 border-gray-500 opacity-50 hover:opacity-75' 
              : 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
          ]"
        >
          <!-- 勾选框 + 删除按钮 -->
          <div class="absolute top-4 right-4 flex gap-2">
            <input 
              type="checkbox" 
              :checked="t.completed" 
              @change="() => toggle(t.id)" 
              class="w-5 h-5 cursor-pointer"
              title="标记完成"
            />
            <button
              @click="deleteTask(t.id)"
              class="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="删除任务"
            >
              🗑️
            </button>
          </div>

          <!-- 任务名称 -->
          <div :class="['text-xl font-bold mb-3 pr-16 break-words', { 'line-through text-gray-400': t.completed }]">
            {{ t.name }}
          </div>

          <!-- 简介 -->
          <div v-if="t.description" :class="['text-sm mb-3 line-clamp-2', t.completed ? 'text-gray-400' : 'text-gray-200']">
            {{ t.description }}
          </div>

          <!-- 截止日期 + 标签 -->
          <div class="flex gap-2 flex-wrap mb-3">
            <div 
              v-if="t.deadline" 
              :class="['px-3 py-1 rounded-full text-xs font-semibold', getDeadlineClass(t.deadline)]"
            >
              📅 {{ formatDeadline(t.deadline) }}
            </div>
            <div 
              v-for="tag in t.tags" 
              :key="tag" 
              :class="['px-3 py-1 rounded-full text-xs font-medium', t.completed ? 'bg-gray-600 text-gray-300' : 'bg-purple-600/40 text-purple-200']"
            >
              {{ tag }}
            </div>
          </div>

          <!-- 创建时间 -->
          <div :class="['text-xs mt-3', t.completed ? 'text-gray-500' : 'text-gray-400']">
            创建：{{ new Date(t.createdAt).toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="mt-4 text-sm text-gray-400 border-t border-gray-700 pt-4">
      💡 通过手机/PC 访问 <span class="text-sky-400">?mode=edit</span> 可派发新任务
    </div>
  </div>
</template>

<style scoped>
input[type="checkbox"] {
  cursor: pointer;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
