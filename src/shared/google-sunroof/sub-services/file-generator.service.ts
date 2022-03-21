/* eslint-disable no-plusplus */
/* eslint-disable no-console */
const GeoTIFF = require('geotiff');
import { chunk } from 'lodash';
import { PNG } from 'pngjs';

import type { Pixel, Color } from '../types';
import { gray, setPixelColor, toArrayBuffer, getPixelColor } from '../utils';
import {fluxGradient, fluxMax, fluxMin, magenta} from '../constants';

export async function generatePng(dataLabel: any, tiffBuffer: any) : Promise<any> {
  const layers = await generateLayers( tiffBuffer );

  let drawFunction = 'drawHeatmap';

  if ( dataLabel === 'mask' ) { 
    drawFunction = 'drawMask' 
  } else if ( dataLabel === 'rgb' ) {
    drawFunction = 'drawSatellite'
  }
  
  const response = await eval(drawFunction)(layers);
 
  return response;  
}

async function drawHeatmap( layers: any ) : Promise<PNG> {
  const { height, width } = layers;
  const [fluxLayer] = layers;
  const flux = chunk(fluxLayer, width);
  const newPng = new PNG({ height, width });

  let min = 8760;
  let max = 0;
  for (let pixelIndex = 0; pixelIndex < fluxLayer.length; pixelIndex++) {
      const value = fluxLayer[pixelIndex];
      if (value < min) min = value;
      if (value > max) max = value;
  }
  const range = max - min;

  const fluxRange = fluxMax - fluxMin;
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
          const pixel: Pixel = [x, y];
          const fluxValue = flux[y][x] as number;

          const percentage = (fluxValue - fluxMin) / fluxRange;
          const fluxGradientIndex = Math.floor(
              percentage * fluxGradient.length
          );
          const color = fluxGradient[fluxGradientIndex];
          setPixelColor(newPng, pixel, color);
      }
  }

  
  return newPng;
}

async function drawMask( layers: any ) : Promise<PNG> {
  const { height, width } = layers;
  const [layer] = layers;
  const mask = chunk(layer, width);

  const newPng = new PNG({ height, width });

  for (let y = 0; y < layers.height; y++) {
    for (let x = 0; x < layers.width; x++) {
      const pixel: Pixel = [x, y];
      const value = (mask[y][x] as number) * 255;
      const color = gray(value);
      setPixelColor(newPng, pixel, color);
    }
  }

  return newPng;
}

async function drawSatellite( layers: any ) : Promise<PNG> {
  const { height, width } = layers;
  const [redLayer, greenLayer, blueLayer] = layers;
  const rgbColors = {
    reds: chunk(redLayer, width),
    greens: chunk(greenLayer, width),
    blues: chunk(blueLayer, width)
  }

  // show center pixels
  const newPng = new PNG({
      height: layers.height,
      width: layers.width,
  });

  for (let y = 0; y < layers.height; y++) {
      for (let x = 0; x < layers.width; x++) {
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

export async function generateMaskedHeatmapPng(dataLabel: any, tiffBuffer: any, maskBuffer: any, rgbBuffer: any) : Promise<PNG> {
  const fluxLayers = await generateLayers( tiffBuffer );
  const maskLayers = await generateLayers( maskBuffer );
  const satelliteLayers = await generateLayers( rgbBuffer );

  const response = await drawMaskedHeatmap(fluxLayers, maskLayers, satelliteLayers);
 
  return response;  
}

async function drawMaskedHeatmap( fluxLayers: any, maskLayers: any, satelliteLayers: any ) : Promise<PNG> {
  const { height, width } = fluxLayers;
  const fluxPng = await drawHeatmap( fluxLayers );

  const [redLayer, greenLayer, blueLayer] = satelliteLayers;
  const reds = chunk(redLayer, width);
  const greens = chunk(greenLayer, width);
  const blues = chunk(blueLayer, width);

  const [layer] = maskLayers;
  const mask = chunk(layer, maskLayers.width);

  const maskedPng = new PNG({ height, width });
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel: Pixel = [x, y];
        let color: Color = magenta;

        if (mask[y][x]) {
            color = getPixelColor(fluxPng, pixel);
        } else {
            color = [
                reds[y][x] as number,
                greens[y][x] as number,
                blues[y][x] as number,
            ];
        }
        setPixelColor(maskedPng, pixel, color);
      }
  }

  return maskedPng;
}

async function generateLayers( tiffBuffer ) : Promise<any> {
  const tiffArrayBuffer = toArrayBuffer( tiffBuffer );
  const tiff = await GeoTIFF.fromArrayBuffer(tiffArrayBuffer);
  const layers = await tiff.readRasters();

  return layers;
}