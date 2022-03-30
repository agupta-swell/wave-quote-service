import type { Color } from './sub-services/types'

export const SUNROOF_API = {
  HOST: 'https://earthenginesolar.googleapis.com',
  VERSION: 'v1',
  BUILDINGS_FIND_CLOSEST: 'buildings:findClosest',
  SOLAR_INFO_GET: 'solarInfo:get'
};

export const red: Color = [255, 0, 0]
export const green: Color = [0, 255, 0]
export const blue: Color = [0, 0, 255]
export const yellow: Color = [255, 255, 0]
export const magenta: Color = [255, 0, 255]
export const cyan: Color = [0, 255, 255]
export const white: Color = [255, 255, 255]
export const black: Color = [0, 0, 0]

export const fluxMin = 0
export const fluxMax = 4000
export const fluxGradientStops = {
  0: <Color>[67,23,89],
  50: <Color>[222,162,57],
  100: <Color>[254,255,63]
}
