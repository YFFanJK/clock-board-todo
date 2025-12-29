<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CalendarView from './components/CalendarView.vue'
import ClockWeather from './components/ClockWeather.vue'
import SettingsModal from './components/SettingsModal.vue'
import SmartHome from './components/SmartHome.vue'
import WeatherEffects from './components/WeatherEffects.vue'
import TodoView from './components/TodoView.vue'
import TodoEdit from './components/TodoEdit.vue'
import { useWeatherStore } from './stores/weather'

const currentPage = ref(1)
const showSettings = ref(false)
const smartHomeRef = ref<any>(null)
const calendarRef = ref<any>(null)
const urlParams = new URLSearchParams(window.location.search)
const isEditMode = urlParams.get('mode') === 'edit'
const viewportRef = ref<HTMLElement | null>(null)

const weatherStore = useWeatherStore()
const { weatherData, showRainEffect, showThunderEffect, showSnowEffect } = storeToRefs(weatherStore)

// 判断是否需要渲染天气特效组件
const shouldShowWeatherEffects = computed(() => {
  if (!weatherData.value) return false

  const code = weatherData.value.current?.weather_code ?? -1

  if (showRainEffect.value) {
    const isRaining = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)
    if (isRaining) return true
  }

  if (showSnowEffect.value) {
    const isSnowing = (code >= 71 && code <= 77) || (code === 85 || code === 86)
    if (isSnowing) return true
  }

  if (showThunderEffect.value) {
    const isThundering = code === 95 || code === 96 || code === 99
    if (isThundering) return true
  }

  return false
})

let startX = 0
let autoReturnTimer: number | null = null
const TOTAL_PAGES = 4
const THRESHOLD_RATIO = 0.2

function resetAutoReturnTimer() {
  if (autoReturnTimer) {
    clearTimeout(autoReturnTimer)
    autoReturnTimer = null
  }

  if (currentPage.value !== 1) {
    autoReturnTimer = window.setTimeout(() => {
      goToPage(1)
    }, 30000) // 30 seconds
  }
}

function goToPage(page: number) {
  currentPage.value = page
  resetAutoReturnTimer()

  // 切换到智能首页 (page 0) 时更新状态
  if (page === 0 && smartHomeRef.value) {
    smartHomeRef.value.updateAllStates()
  }

  // 切换到日历看板 (page 2) 时更新当前日期
  if (page === 2 && calendarRef.value) {
    calendarRef.value.refreshToday()
  }
}

function handleTouchStart(e: TouchEvent) {
  // record starting X coordinate
  startX = e.touches[0].clientX
  resetAutoReturnTimer()
}

function handleTouchMove(e: TouchEvent) {
  // prevent page scroll while swiping inside the app container
  e.preventDefault()
}

function handleTouchEnd(e: TouchEvent) {
  const endX = e.changedTouches[0].clientX
  const diffX = endX - startX

  const threshold = window.innerWidth * THRESHOLD_RATIO
  if (Math.abs(diffX) <= threshold) return

  if (diffX > 0) {
    // swipe right -> previous page
    const prev = Math.max(currentPage.value - 1, 0)
    if (prev !== currentPage.value) goToPage(prev)
  } else {
    // swipe left -> next page
    const next = Math.min(currentPage.value + 1, TOTAL_PAGES - 1)
    if (next !== currentPage.value) goToPage(next)
  }
}

function handleMouseDown(e: MouseEvent) {
  startX = e.clientX
  resetAutoReturnTimer()
}

function handleMouseUp(e: MouseEvent) {
  const endX = e.clientX
  const diffX = endX - startX
  const threshold = window.innerWidth * THRESHOLD_RATIO
  if (Math.abs(diffX) <= threshold) return

  if (diffX > 0) {
    const prev = Math.max(currentPage.value - 1, 0)
    if (prev !== currentPage.value) goToPage(prev)
  } else {
    const next = Math.min(currentPage.value + 1, TOTAL_PAGES - 1)
    if (next !== currentPage.value) goToPage(next)
  }
}

function onSettingsSaved() {
  if (smartHomeRef.value) {
    smartHomeRef.value.updateAllStates()
  }
}

onMounted(() => {
  window.addEventListener('keydown', resetAutoReturnTimer)
  // listen for touchstart globally to reset timer
  window.addEventListener('touchstart', resetAutoReturnTimer)
  // keep click as a fallback for mouse users
  window.addEventListener('click', resetAutoReturnTimer)
})

onUnmounted(() => {
  window.removeEventListener('keydown', resetAutoReturnTimer)
  window.removeEventListener('touchstart', resetAutoReturnTimer)
  window.removeEventListener('click', resetAutoReturnTimer)

  if (autoReturnTimer)
    clearTimeout(autoReturnTimer)
})
</script>

<template>
  <div
    ref="viewportRef"
    class="viewport-container overflow-hidden relative w-screen h-screen bg-black"
    @touchstart="handleTouchStart"
    @touchmove.prevent="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    style="user-select: none; -webkit-user-select: none;"
  >
    <template v-if="!isEditMode">
      <div
        class="main-slider flex h-full transition-transform duration-300 ease-in-out"
        :style="{ transform: `translateX(-${currentPage * 100}vw)`, width: '400vw' }"
      >
        <div class="slide-page w-screen h-screen flex items-center justify-center flex-shrink-0">
          <SmartHome ref="smartHomeRef" @open-settings="showSettings = true" />
        </div>
        <div class="slide-page w-screen h-screen flex items-center justify-center flex-shrink-0">
          <ClockWeather />
        </div>
        <div class="slide-page w-screen h-screen flex items-center justify-center flex-shrink-0">
          <CalendarView ref="calendarRef" />
        </div>
        <div class="slide-page w-screen h-screen flex items-center justify-center flex-shrink-0">
          <TodoView />
        </div>
      </div>
    </template>
    <template v-else>
      <TodoEdit />
    </template>

    <WeatherEffects v-if="shouldShowWeatherEffects" />

    <!-- Settings Modal -->
    <SettingsModal
      :show="showSettings"
      :entities-states="smartHomeRef?.entitiesStates || {}"
      @close="showSettings = false"
      @saved="onSettingsSaved"
    />
  </div>
</template>

<style scoped>
.cubic-bezier {
  transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
}
/* Improve touch responsiveness on touch devices */
.viewport-container {
  touch-action: manipulation;
}
</style>
