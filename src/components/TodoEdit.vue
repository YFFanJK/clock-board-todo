<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTodoStore } from '../stores/todos'

const todoStore = useTodoStore()
const { todos } = storeToRefs(todoStore)

const name = ref('')
const description = ref('')
const deadline = ref('')
const tagInput = ref('')
const tags = ref<string[]>([])

function submitTask() {
  const n = name.value.trim()
  if (!n) return
  todoStore.addTask(n, description.value, deadline.value || undefined, tags.value.length > 0 ? tags.value : undefined)
  name.value = ''
  description.value = ''
  deadline.value = ''
  tags.value = []
  tagInput.value = ''
  const el = document.getElementById('task-name') as HTMLInputElement | null
  el?.focus()
}

function addTag() {
  const t = tagInput.value.trim()
  if (!t) return
  tags.value.push(t)
  tagInput.value = ''
}

function removeTag(idx: number) {
  tags.value.splice(idx, 1)
}

function toggleTask(id: string) {
  todoStore.toggleTask(id)
}

function deleteTask(id: string) {
  if (confirm('确认删除此任务？')) {
    todoStore.deleteTask(id)
  }
}
</script>

<template>
  <div class="w-screen h-screen bg-neutral-900 text-white flex flex-col overflow-hidden">
    <!-- 表单部分 -->
    <div class="p-6 border-b border-white/10 flex-shrink-0">
      <h1 class="text-2xl mb-6">派发任务</h1>
      
      <div class="space-y-4">
        <!-- 任务名称 -->
        <div>
          <label class="block text-sm mb-2">任务名称 *</label>
          <input 
            id="task-name"
            v-model="name" 
            @keyup.enter="submitTask" 
            placeholder="输入任务名称" 
            class="w-full p-3 rounded bg-white/5 outline-none border border-white/10 focus:border-sky-500" 
          />
        </div>

        <!-- 简介 -->
        <div>
          <label class="block text-sm mb-2">简介</label>
          <textarea 
            v-model="description" 
            placeholder="任务描述（可选）" 
            rows="2"
            class="w-full p-3 rounded bg-white/5 outline-none border border-white/10 focus:border-sky-500 resize-none" 
          />
        </div>

        <!-- 截止日期 -->
        <div>
          <label class="block text-sm mb-2">截止日期</label>
          <input 
            v-model="deadline" 
            type="date" 
            class="w-full p-3 rounded bg-white/5 outline-none border border-white/10 focus:border-sky-500" 
          />
        </div>

        <!-- 标签 -->
        <div>
          <label class="block text-sm mb-2">标签</label>
          <div class="flex gap-2 mb-2">
            <input 
              v-model="tagInput" 
              @keyup.enter="addTag"
              placeholder="输入标签后回车添加" 
              class="flex-1 p-3 rounded bg-white/5 outline-none border border-white/10 focus:border-sky-500" 
            />
            <button @click="addTag" class="px-4 py-3 bg-emerald-600 rounded hover:bg-emerald-700">添加标签</button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div v-for="(tag, idx) in tags" :key="idx" class="bg-sky-600 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {{ tag }}
              <button @click="removeTag(idx)" class="text-white/60 hover:text-white">✕</button>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="flex gap-2 pt-4">
          <button @click="submitTask" class="flex-1 px-4 py-3 bg-sky-500 rounded hover:bg-sky-600 font-semibold">发送任务</button>
        </div>
        <div class="text-sm text-gray-400">此界面适合手机或 PC 快速输入，新建的任务会实时同步到展板。</div>
      </div>
    </div>

    <!-- 任务列表部分 -->
    <div class="flex-1 overflow-auto p-6">
      <h2 class="text-xl mb-4">任务列表</h2>
      <div v-if="todos.length === 0" class="text-gray-400 text-center py-8">暂无任务</div>
      <ul class="space-y-3">
        <li v-for="t in todos" :key="t.id" :class="['bg-white/5 p-4 rounded border border-white/10 group transition-all', t.completed ? 'opacity-60' : '']">
          <div class="flex items-start gap-3 mb-2">
            <input type="checkbox" :checked="t.completed" @change="() => toggleTask(t.id)" class="mt-1" />
            <div class="flex-1">
              <div :class="['text-lg font-semibold', { 'line-through text-gray-500': t.completed }]">{{ t.name }}</div>
              <div v-if="t.description" :class="['text-sm mt-1', t.completed ? 'text-gray-500' : 'text-gray-300']">{{ t.description }}</div>
              <div class="flex gap-2 mt-2 flex-wrap">
                <div v-if="t.deadline" class="text-xs bg-orange-600/30 text-orange-200 px-2 py-1 rounded">
                  📅 {{ t.deadline }}
                </div>
                <div v-for="tag in t.tags" :key="tag" class="text-xs bg-sky-600/30 text-sky-200 px-2 py-1 rounded">
                  {{ tag }}
                </div>
              </div>
              <div :class="['text-xs mt-2', t.completed ? 'text-gray-600' : 'text-gray-500']">{{ new Date(t.createdAt).toLocaleString() }}</div>
            </div>
            <button 
              @click="deleteTask(t.id)"
              class="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="删除任务"
            >
              🗑️
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
input[type="checkbox"] {
  width: 18px;
  height: 18px;
}
textarea { outline: none; }
</style>
