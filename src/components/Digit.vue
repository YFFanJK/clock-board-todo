<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  value: number
  trigger?: any
}>()

const displayValue = ref(props.value) // 当前显示的数字
const nextValue = ref(props.value) // 即将进入的数字
const isAnimating = ref(false) // 是否正在执行滑动动画
const containerRotate = ref(`rotate(${(Math.random() * 12 - 6).toFixed(1)}deg)`)

watch(() => props.trigger, () => {
  containerRotate.value = `rotate(${(Math.random() * 12 - 6).toFixed(1)}deg)`
})

watch(() => props.value, (newVal, oldVal) => {
  if (newVal === oldVal) return

  // 1. 准备新数字角度
  containerRotate.value = `rotate(${(Math.random() * 12 - 6).toFixed(1)}deg)`

  // 2. 准备动画：将新数字放在下方，旧数字保持在原位
  nextValue.value = newVal

  // 3. 开启过度动画
  isAnimating.value = true

  // 4. 动画结束后（0.8s），瞬间归位
  setTimeout(() => {
    isAnimating.value = false
    displayValue.value = newVal // 将主数字设为新值
  }, 800)
})

onMounted(() => {
  displayValue.value = props.value
  nextValue.value = props.value
})
</script>

<template>
  <div class="digit-container" :style="{ transform: containerRotate }">
    <div
      class="digit-window"
      :class="{ animating: isAnimating }"
    >
      <!-- 当前数字 -->
      <div class="digit-item">
        {{ displayValue }}
      </div>
      <!-- 下一个数字（仅在动画时从下方推上来） -->
      <div class="digit-item">
        {{ nextValue }}
      </div>
    </div>
  </div>
</template>

  <style scoped>
  .digit-container {
  position: relative;
  display: inline-block;
  height: 1em;
  width: 0.8em;
  overflow: hidden;
  opacity: 0.85;
  margin: 0 -0.12em;
  vertical-align: middle;
  transition: transform 0.6s linear;
}

.digit-window {
  display: flex;
  flex-direction: column;
  width: 100%;
  transform: translateY(0);
}

/* 动画状态：向上平移 1em，露出下方的 nextValue */
.digit-window.animating {
  transform: translateY(-1em);
  transition: transform 0.8s cubic-bezier(0.18, 0.18, 0.43, 1.34);
}

.digit-item {
  display: block;
  height: 1em;
  line-height: 1em;
  text-align: center;
  flex-shrink: 0;
}
</style>
