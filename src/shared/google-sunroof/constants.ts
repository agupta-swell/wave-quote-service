import type { Color } from './types'

export const red: Color = [255, 0, 0]
export const green: Color = [0, 255, 0]
export const blue: Color = [0, 0, 255]
export const yellow: Color = [255, 255, 0]
export const magenta: Color = [255, 0, 255]
export const cyan: Color = [0, 255, 255]
export const white: Color = [255, 255, 255]
export const black: Color = [0, 0, 0]

export const fluxMin = 550
export const fluxMax = 3500
// `percent` must be between 0 and 1 inclusive!
// stops must be defined in `percent` order!
export const fluxGradient: { percent: number, color: Color }[] = [{
  percent: 0,
  color: [67, 23, 89],
}, {
  percent: .5,
  color: [222, 162, 57],
}, {
  percent: 1,
  color: [254, 255, 63],
}]

export const DAY_COUNT_BY_MONTH_INDEX = {
  0: 31,
  1: 28,
  2: 31,
  3: 30,
  4: 31,
  5: 30,
  6: 31,
  7: 31,
  8: 30,
  9: 31,
  10: 30,
  11: 31,
}
