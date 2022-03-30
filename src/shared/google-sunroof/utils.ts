/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
import type { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';
import type { Color } from './sub-services/types';

import { Pixel, PixelPolygon } from './sub-services/types';
import { magenta, fluxMin, fluxMax, fluxGradientStops } from './constants';

export const getPixelColor = (png: PNG, pixel: Pixel): Color => {
  const [x, y] = pixel;
  const pixelIndex = y * png.width + x;
  const pixelOffset = pixelIndex * 4;

  return [png.data[pixelOffset], png.data[pixelOffset + 1], png.data[pixelOffset + 2], png.data[pixelOffset + 3]];
};

export const lerp = (a: number, b: number, percent: number): number => {
  const range = b - a;
  return Math.round(a + percent * range);
};

export const lerpColor = (a: Color, b: Color, percent: number): Color => [
  lerp(a[0], b[0], percent),
  lerp(a[1], b[1], percent),
  lerp(a[2], b[2], percent),
  lerp(a[3] ?? 255, b[3] ?? 255, percent),
];

export const setPixelColor = (png: PNG, pixel: Pixel, color: Color = magenta): void => {
  const [x, y] = pixel;
  const [red, green, blue, alpha = 255] = color;
  const pixelIndex = y * png.width + x;
  const pixelOffset = pixelIndex * 4;
  png.data[pixelOffset] = red;
  png.data[pixelOffset + 1] = green;
  png.data[pixelOffset + 2] = blue;
  png.data[pixelOffset + 3] = alpha;
};

export const getHeatmapColor = (fluxValue: number): Color => {
  const fluxRange = fluxMax - fluxMin;
  const percentage = (fluxValue - fluxMin) / fluxRange;
 
  if ( fluxValue < fluxMin ) {
    return fluxGradientStops[0];
  } else if ( fluxValue > fluxMax ) {
    return fluxGradientStops[100];
  } else if ( fluxValue === (fluxMax + fluxMin) / 2){
    return fluxGradientStops[50];
  } else if (percentage < 0.5) {
    return lerpColor(fluxGradientStops[0], fluxGradientStops[50], percentage * 2);
  } else {
    return lerpColor(fluxGradientStops[50], fluxGradientStops[100], percentage / 2);
  }
}

export const writePngToFile = async (png: PNG, filename: string): Promise<void> => {
  await fs.promises.mkdir(path.dirname(filename), { recursive: true });
  png.pack().pipe(fs.createWriteStream(filename));
};

const between = (p: number, a: number, b: number) => (p >= a && p <= b) || (p <= a && p >= b);

const isPixelInPolygon = (pixelToTest: Pixel, polygon: PixelPolygon) => {
  let isInside = false;
  for (let i = polygon.length - 1, j = 0; j < polygon.length; i = j, j++) {
    const A = polygon[i];
    const B = polygon[j];

    // corner cases
    if ((pixelToTest[0] === A[0] && pixelToTest[1] === A[1]) || (pixelToTest[0] === B[0] && pixelToTest[1] === B[1]))
      return true;
    if (A[1] === B[1] && pixelToTest[1] === A[1] && between(pixelToTest[0], A[0], B[0])) return true;

    if (between(pixelToTest[1], A[1], B[1])) {
      // if pixelToTest inside the vertical range
      // filter out "ray pass vertex" problem by treating the line a little lower
      if ((pixelToTest[1] === A[1] && B[1] >= A[1]) || (pixelToTest[1] === B[1] && A[1] >= B[1])) {
        continue;
      }
      // pixelToTest lays on left side of AB if c > 0
      const c = (A[0] - pixelToTest[0]) * (B[1] - pixelToTest[1]) - (B[0] - pixelToTest[0]) * (A[1] - pixelToTest[1]);
      if (c === 0) {
        return true;
      }
      if (A[1] < B[1] === c > 0) {
        isInside = !isInside;
      }
    }
  }

  return isInside;
};

export const getPanelPixels = (polygon: PixelPolygon) => {
  const panelPixels = new Array(2);
  let counter = 0;

  // get bounding box coordinates
  let minX = polygon[0][0];
  let maxX = polygon[0][0];
  let minY = polygon[0][1];
  let maxY = polygon[0][1];

  for (let i = 1; i < polygon.length; i++) {
    minX = Math.min(polygon[i][0], minX);
    maxX = Math.max(polygon[i][0], maxX);
    minY = Math.min(polygon[i][1], minY);
    maxY = Math.max(polygon[i][1], maxY);
  }

  for (let xp = minX; xp <= maxX; xp++) {
    for (let yp = minY; yp <= maxY; yp++) {
      if (isPixelInPolygon([xp, yp], polygon)) {
        panelPixels[counter] = [xp, yp];
        counter++;
      }
    }
  }

  if ( process.env.DEBUG_SUNROOF ) {
    console.log(`${counter} pixels added`);
  }

  return panelPixels;
};

export const toArrayBuffer = ( buffer ) => {
  const arrayBuffer = new ArrayBuffer( buffer.length );
  const view = new Uint8Array( arrayBuffer );
  for ( let i = 0; i < buffer.length; ++i ){
    view[i] = buffer[i];
  }
  return arrayBuffer;
}
