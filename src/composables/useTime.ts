import type { LunarInfo } from '../types'
import { onMounted, onUnmounted, ref } from 'vue'
import { getLunarDate } from '../utils/lunar'

export function useTime() {
  const now = ref(new Date())
  const h1 = ref(0)
  const h2 = ref(0)
  const m1 = ref(0)
  const m2 = ref(0)
  const s1 = ref(0)
  const s2 = ref(0)
  const lunar = ref<LunarInfo>(getLunarDate(new Date()))
  const showSeconds = ref(false)

  let timer: number

  const update = () => {
    const d = new Date()
    now.value = d

    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')

    h1.value = Number.parseInt(h[0])
    h2.value = Number.parseInt(h[1])
    m1.value = Number.parseInt(m[0])
    m2.value = Number.parseInt(m[1])
    s1.value = Number.parseInt(s[0])
    s2.value = Number.parseInt(s[1])

    // Update lunar once a day or on init
    if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
      lunar.value = getLunarDate(d)
    }
  }

  onMounted(() => {
    update()
    timer = window.setInterval(update, 1000)
    lunar.value = getLunarDate(new Date())
  })

  onUnmounted(() => {
    clearInterval(timer)
  })

  return {
    now,
    h1,
    h2,
    m1,
    m2,
    s1,
    s2,
    lunar,
    showSeconds,
  }
}
