import type { HAConfig } from '../types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  // 1. 读取旧数据作为初始值
  const oldHaConfig = localStorage.getItem('ha_config')
  const haConfig = ref<HAConfig>(oldHaConfig
    ? JSON.parse(oldHaConfig)
    : {
        url: '',
        token: '',
        entities: [],
      })

  // 2. 清理旧版 key
  if (oldHaConfig) {
    localStorage.removeItem('ha_config')
  }

  return {
    haConfig,
  }
}, {
  persist: true,
})
