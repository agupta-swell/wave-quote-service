import type { Color } from './types'

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
export const fluxGradient: Color[] = [
  [82, 36, 117],
  [85, 38, 115],
  [89, 40, 113],
  [93, 43, 111],
  [97, 45, 109],
  [101, 48, 107],
  [105, 50, 105],
  [108, 53, 103],
  [112, 55, 101],
  [116, 57, 99],
  [120, 60, 97],
  [124, 62, 95],
  [128, 65, 93],
  [131, 67, 91],
  [135, 70, 89],
  [139, 72, 87],
  [143, 75, 85],
  [147, 77, 83],
  [151, 79, 81],
  [155, 82, 79],
  [158, 84, 77],
  [162, 87, 75],
  [166, 89, 73],
  [170, 92, 71],
  [174, 94, 69],
  [178, 96, 67],
  [181, 99, 65],
  [185, 101, 63],
  [189, 104, 61],
  [193, 106, 59],
  [197, 109, 57],
  [201, 111, 55],
  [205, 114, 53],
  [206, 118, 51],
  [207, 122, 49],
  [209, 126, 48],
  [210, 130, 46],
  [212, 134, 45],
  [213, 138, 43],
  [214, 142, 42],
  [216, 146, 40],
  [217, 150, 39],
  [219, 154, 37],
  [220, 158, 36],
  [221, 162, 34],
  [223, 166, 33],
  [224, 170, 31],
  [226, 174, 30],
  [227, 178, 28],
  [228, 182, 26],
  [230, 186, 25],
  [231, 190, 23],
  [233, 194, 22],
  [234, 198, 20],
  [235, 202, 19],
  [237, 206, 17],
  [238, 210, 16],
  [240, 214, 14],
  [241, 218, 13],
  [242, 222, 11],
  [244, 226, 10],
  [245, 230, 8],
  [247, 234, 7],
  [248, 238, 5],
  [250, 242, 4],
  [250, 242, 11],
  [250, 242, 19],
  [250, 243, 27],
  [250, 243, 35],
  [250, 244, 43],
  [250, 244, 51],
  [251, 244, 58],
  [251, 245, 66],
  [251, 245, 74],
  [251, 246, 82],
  [251, 246, 90],
  [251, 246, 98],
  [252, 247, 105],
  [252, 247, 113],
  [252, 248, 121],
  [252, 248, 129],
  [252, 248, 137],
  [252, 249, 145],
  [252, 249, 153],
  [253, 250, 160],
  [253, 250, 168],
  [253, 250, 176],
  [253, 251, 184],
  [253, 251, 192],
  [253, 252, 200],
  [254, 252, 207],
  [254, 252, 215],
  [254, 253, 223],
  [254, 253, 231],
  [254, 254, 239],
  [254, 254, 247],
  [255, 255, 255],
]
