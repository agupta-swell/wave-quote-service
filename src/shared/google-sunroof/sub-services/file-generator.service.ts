/* eslint-disable no-plusplus */
/* eslint-disable no-console */
import * as path from 'path';
const GeoTIFF = require('geotiff');
import { chunk } from 'lodash';
import { PNG } from 'pngjs';

import type { Pixel, Color } from '../types';
import { gray, setPixelColor, toArrayBuffer, writePngToFile } from '../utils';
import {fluxGradient, fluxMax, fluxMin} from '../constants';

export async function generatePng(dataLabel: any, tiffBuffer: any) : Promise<PNG> {
  const pngFilename = path.join(__dirname, 'png', `${dataLabel}.png`);
  const tiffArrayBuffer = toArrayBuffer( tiffBuffer );
  const tiff = await GeoTIFF.fromArrayBuffer(tiffArrayBuffer);
  const layers = await tiff.readRasters();

  let drawFunction = 'drawHeatmap';

  if ( dataLabel === 'mask' ) { 
    drawFunction = 'drawMask' 
  } else if ( dataLabel === 'rgb' ) {
    drawFunction = 'drawSatellite'
  }
  
  const newPng = await eval(drawFunction)(layers);
 
  await writePngToFile( newPng, pngFilename );

  return newPng;  
}

async function drawHeatmap( layers: any ) : Promise<PNG> {
  const { height, width } = layers;
  let fluxValues = Array();

  console.log("flux height", height, "width", width);

  console.log(`create the annualFlux heatmap PNG...`);
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
  console.log("flux values: min", min, "max", max, "range", range);

  const fluxRange = fluxMax - fluxMin;
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
          const pixel: Pixel = [x, y];
          const fluxValue = flux[y][x] as number;
          fluxValues.push(fluxValue);

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
  console.log('mask height', height, 'width', width);

  const [layer] = layers;
  const image = chunk(layer, width);

  console.log('generating png...');
  const newPng = new PNG({ height, width });

  for (let y = 0; y < layers.height; y++) {
    for (let x = 0; x < layers.width; x++) {
      const pixel: Pixel = [x, y];
      const value = (image[y][x] as number) * 255;
      const color = gray(value);
      setPixelColor(newPng, pixel, color);
    }
  }

  return newPng;
}

async function drawSatellite( layers: any ) : Promise<PNG> {
  const { height, width } = layers;
  const [redLayer, greenLayer, blueLayer] = layers;
  const reds = chunk(redLayer, width);
  const greens = chunk(greenLayer, width);
  const blues = chunk(blueLayer, width);

  // show center pixels
  const newPng = new PNG({
      height: layers.height,
      width: layers.width,
  });

  for (let y = 0; y < layers.height; y++) {
      for (let x = 0; x < layers.width; x++) {
          const driftPixel: Pixel = [x, y];
          const driftColor: Color = [
              reds[y][x] as number,
              greens[y][x] as number,
              blues[y][x] as number,
          ];
          setPixelColor(newPng, driftPixel, driftColor);
      }
  }

  return newPng;
}