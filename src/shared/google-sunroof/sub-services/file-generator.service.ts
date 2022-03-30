/* eslint-disable no-plusplus */
/* eslint-disable no-console */
import { fromArrayBuffer } from 'geotiff';
import { chunk } from 'lodash';
import { PNG } from 'pngjs';

import type { Pixel, Color } from './types';
import { setPixelColor, toArrayBuffer, getPixelColor, lerpColor, getHeatmapColor } from '../utils';
import { fluxMax, fluxMin, magenta, black, white } from '../constants';

import type { ReadRasterResult, TypedArray } from './geotiff';

export async function generatePng(dataLabel: string, tiffBuffer: Buffer) : Promise<PNG> {
  const layers = await getLayersFromBuffer(tiffBuffer);

  switch (dataLabel) {
    case 'mask':
      return await drawMask(layers);
    case 'rgb':
      return await drawSatellite(layers);
    default:
      return await drawHeatmap(layers);
  }
}

export async function drawMonthlyHeatmap( layers: ReadRasterResult ): Promise<Array<PNG>> {
  const { height, width } = layers;
 
  return layers.map((layer) => {
    const newPng = new PNG({ height, width });
    const flux = chunk(layer, width)
    
    let min = 0;
    let max = 730;
    for (let pixelIndex = 0; pixelIndex < layer.length; pixelIndex++) {
        const value = layer[pixelIndex];
        if (value < min) min = value;
        if (value > max) max = value;
    }
    const range = max - min;

    for (let y = 0; y < height; y++) {
      
      for (let x = 0; x < width; x++) {
          const pixel: Pixel = [x, y];
          const fluxValue = flux[y][x] as number;

          const percentage = (fluxValue - min) / range;
          const color = getHeatmapColor(fluxValue,percentage);
          setPixelColor(newPng, pixel, color);
      }
    }

    return upScalePng(newPng, 5);
  })
}

function upScalePng( heatMapPng: PNG, resizeFactor: number ) : PNG {
  const interpolatedHeight = (heatMapPng.height - 1) * resizeFactor;
  const interpolatedWidth = (heatMapPng.width - 1) * resizeFactor;
  const interpolated = new PNG({
      height: interpolatedHeight,
      width: interpolatedWidth,
  });
  for (let y = 0; y < heatMapPng.height - 1; y++) {
      for (let x = 0; x < heatMapPng.width - 1; x++) {
          const thisColor = getPixelColor(heatMapPng, [x, y]);
          const xColor = getPixelColor(heatMapPng, [x + 1, y]);
          const yColor = getPixelColor(heatMapPng, [x, y + 1]);
          const xyColor = getPixelColor(heatMapPng, [x + 1, y + 1]);
          for (let b = 0; b < resizeFactor; b++) {
              const percentB = b / resizeFactor;
              const leftColor = lerpColor(thisColor, yColor, percentB);
              const rightColor = lerpColor(xColor, xyColor, percentB);
              for (let a = 0; a < resizeFactor; a++) {
                  const pixel: Pixel = [
                      resizeFactor * x + a,
                      resizeFactor * y + b,
                  ];
                  const percentA = a / resizeFactor;
                  const color = lerpColor(leftColor, rightColor, percentA);
                  setPixelColor(interpolated, pixel, color);
              }
          }
      }
  }

  return interpolated
}

function drawHeatmap( layers: ReadRasterResult ) : PNG {
  const { height, width } = layers;
  const [fluxLayer] = layers;
  const flux = chunk(fluxLayer, width);
  const newPng = new PNG({ height, width });

  const fluxRange = fluxMax - fluxMin;
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
          const pixel: Pixel = [x, y];
          const fluxValue = flux[y][x] as number;

          const percentage = (fluxValue - fluxMin) / fluxRange;
          const color = getHeatmapColor(fluxValue,percentage);
          setPixelColor(newPng, pixel, color);
      }
  }
  
  return newPng;
}

function drawMask( layers: ReadRasterResult ) : PNG {
  const { height, width } = layers;
  const [layer] = layers;
  const mask = chunk(layer, width);

  const newPng = new PNG({ height, width });

  for (let y = 0; y < layers.height; y++) {
    for (let x = 0; x < layers.width; x++) {
      const pixel: Pixel = [x, y];
      const color = mask[y][x] ? white: black;
      setPixelColor(newPng, pixel, color);
    }
  }

  return newPng;
}

function drawSatellite( layers: ReadRasterResult ) : PNG {
  const { height, width } = layers;
  const [redLayer, greenLayer, blueLayer] = layers;
  const rgbColors = {
    reds: chunk(redLayer, width),
    greens: chunk(greenLayer, width),
    blues: chunk(blueLayer, width)
  }

  // show center pixels
  const newPng = new PNG({
      height: height,
      width: width,
  });

  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
          const driftPixel: Pixel = [x, y];
          const driftColor: Color = [
              rgbColors.reds[y][x] as number,
              rgbColors.greens[y][x] as number,
              rgbColors.blues[y][x] as number,
          ];
          setPixelColor(newPng, driftPixel, driftColor);
      }
  }

  return newPng;
}

export async function applyMaskedOverlay(heatMapPng: PNG, maskLayer: TypedArray, rgbPng: PNG) : Promise<PNG> {
  const height = heatMapPng.height;
  const width = heatMapPng.width;

  if ( process.env.DEBUG_SUNROOF ) {
    console.log( `flux height: ${height} || width: ${width}`);
  }

  const maskedPng = new PNG({ height, width });
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel: Pixel = [x, y];
        let color: Color = magenta;

        if (maskLayer[y][x]) {
            color = getPixelColor(heatMapPng, pixel);
        } else {
            color = getPixelColor(rgbPng, pixel);
        }
        setPixelColor(maskedPng, pixel, color);
      }
  }

  return maskedPng;
}

export async function getLayersFromBuffer( tiffBuffer ) : Promise<ReadRasterResult> {
  const tiffArrayBuffer = toArrayBuffer( tiffBuffer );
  const tiff = await fromArrayBuffer(tiffArrayBuffer);
  return await tiff.readRasters() as ReadRasterResult;
}
