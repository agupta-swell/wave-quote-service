import type { Color } from './sub-services/types'

// TODO delete this; moved into google-sunroof.gateway.service
export const SUNROOF_API = {
  HOST: 'https://earthenginesolar.googleapis.com',
  VERSION: 'v1',
  BUILDINGS_FIND_CLOSEST: 'buildings:findClosest',
  SOLAR_INFO_GET: 'solarInfo:get',
};

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
export const fluxGradientStops: Record<number,Color> = {
  0: [67,23,89],
  50: [222,162,57],
  100: [254,255,63]
}
