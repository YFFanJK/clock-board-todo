import type { LunarInfo } from '../types'
import { Solar } from 'lunar-typescript'

export function getLunarDate(date: Date): LunarInfo {
  try {
    // 将公历日期转换为 Solar 对象
    const solar = Solar.fromDate(date)
    // 转换为农历对象
    const lunar = solar.getLunar()

    // 获取农历月（如：正月、冬月、闰二月）
    const month = lunar.getMonthInChinese()
    // 获取农历日（如：初一、十五）
    const day = lunar.getDayInChinese()

    // 获取干支年份（如：乙巳）
    const yearGanzhi = lunar.getYearInGanZhiByLiChun()
    const jieQi = lunar.getJieQi()
    const festivals = lunar.getFestivals()
    const solarFestivals = solar.getFestivals()

    // 获取节日或节气
    const allFestivals = [...festivals, ...solarFestivals]
    const festival = allFestivals.length > 0 ? allFestivals[0] : (jieQi || '')

    const lunarDay = day === '初一' ? `${month}月` : day

    return {
      fullDate: festival ? `${lunarDay} · ${festival}` : lunarDay,
      date: festival || lunarDay, // 优先显示节日/节气，用于日历格子
      year: `${yearGanzhi}年`,
      month: `${month}月`,
      isFestival: !!festival,
      festival,
    }
  }
  catch (e) {
    console.error('Lunar date error (lunar-typescript):', e)
    return {
      fullDate: '加载失败',
      date: '加载失败',
      year: '--年',
      month: '加载失败',
      isFestival: false,
    }
  }
}
