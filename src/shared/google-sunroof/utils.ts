/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
import type { PNG } from 'pngjs';

import type { Color, LatLng, LatLngPolygon, Pixel, PixelPolygon, Vector2 } from './types';

import { magenta, fluxMin, fluxMax, fluxGradient } from './constants';

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

  return panelPixels;
};

export const mapLatLngToVector2 = (
  origin: LatLng,
  location: LatLng,
  pixelsPerMeter: number
): Vector2 => {
  const radiusOfEarthInMeters = 6371009;
  const metersPerDegreeLatitude = (2 * Math.PI * radiusOfEarthInMeters) / 360;

  const metersPerDegreeLongitude =
    metersPerDegreeLatitude *
    Math.cos((Math.abs(origin.lat) / 180) * Math.PI);
  const degreesLatitude = location.lat - origin.lat;
  const degreesLongitude = location.lng - origin.lng;
  const x = degreesLongitude * metersPerDegreeLongitude * pixelsPerMeter;
  const y = -degreesLatitude * metersPerDegreeLatitude * pixelsPerMeter;
  return [Math.round(x), Math.round(y)];
}

export const mapLatLngPolygonToPixelPolygon = (
  origin: LatLng,
  latLngPolygon: LatLngPolygon,
  pixelsPerMeter: number
): PixelPolygon => {
  return latLngPolygon.map((latLng) =>
    mapLatLngToVector2(origin, latLng, pixelsPerMeter)
  );
}

export const addVector2 = (v1: Vector2, v2: Vector2): Vector2 => {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

export const translatePixelPolygon = (
  pixelPolygon: PixelPolygon,
  translation: Vector2
): PixelPolygon => {
  return pixelPolygon.map((pixel) => addVector2(pixel, translation));
}

export const drawLine = (
  png: PNG,
  pixel1: Pixel,
  cornder2: Pixel,
  color: Color = magenta
) => {
  const [x1, y1] = pixel1;
  const [x2, y2] = cornder2;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const rangeX = maxX - minX;
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const rangeY = maxY - minY;

  if (rangeX > rangeY) {
    for (let x = minX; x <= maxX; x++) {
      const percent = (x - minX) / rangeX;
      const y = x1 < x2 ? lerp(y1, y2, percent) : lerp(y2, y1, percent);
      setPixelColor(png, [x, y], color);
    }
  } else {
    for (let y = minY; y <= maxY; y++) {
      const percent = (y - minY) / rangeY;
      const x = y1 < y2 ? lerp(x1, x2, percent) : lerp(x2, x1, percent);
      setPixelColor(png, [x, y], color);
    }
  }
}

export const drawPolygon = (png: PNG, polygon: PixelPolygon, color: Color = magenta) => {
  for (let i = 0; i < polygon.length; i++) {
    const a = i === 0 ? polygon[polygon.length - 1] : polygon[i - 1];
    const b = polygon[i];
    drawLine(png, a, b, color);
  }
}

export const getHeatmapColor = (fluxValue: number): Color => {
  const fluxRange = fluxMax - fluxMin;
  const percentage = (fluxValue - fluxMin) / fluxRange;

  if ( percentage <= 0 ) {
    return fluxGradient[0].color
  }

  if ( percentage >= 1 ) {
    return fluxGradient[fluxGradient.length - 1].color
  }

  for ( let i = 1 ; i < fluxGradient.length ; i++ ) {
    const thisStop = fluxGradient[i]

    if ( percentage === thisStop.percent ) {
      return thisStop.color
    }

    if ( percentage < thisStop.percent ) {
      const previousStop = fluxGradient[i - 1]
      const stopRange = thisStop.percent - previousStop.percent
      const lerpAmount = (percentage - previousStop.percent) / stopRange
      return lerpColor(previousStop.color, thisStop.color, lerpAmount)
    }
  }

  // this should never happen
  return magenta;
}
