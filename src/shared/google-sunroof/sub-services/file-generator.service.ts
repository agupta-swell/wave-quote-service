/* eslint-disable no-plusplus */
/* eslint-disable no-console */
const GeoTIFF = require('geotiff');
import { chunk } from 'lodash';
import { PNG } from 'pngjs';

import type { Pixel, Color } from '../types';
import { gray, setPixelColor, toArrayBuffer, getPixelColor, lerpColor } from '../utils';
import {fluxGradient, fluxMax, fluxMin, magenta} from '../constants';

const pixelsPerMeter = 5;

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

export async function generateMonthlyPngs( tiffBuffer ) : Promise<any> {
  const tiffArrayBuffer = toArrayBuffer( tiffBuffer );
  const tiff = await GeoTIFF.fromArrayBuffer(tiffArrayBuffer);
  const layers = ( await tiff.readRasters()) as number[][] & {
    height: number;
    width: number;
  };

  return await drawMonthlyHeatmap( layers );
}

async function drawMonthlyHeatmap( layers: any ): Promise<any> {
  const { height, width } = layers;
 
  let response = Array();

  layers.map((layer, layerIndex) => {
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
          const fluxGradientIndex = Math.floor(
              percentage * fluxGradient.length
          );
          const color = fluxGradient[fluxGradientIndex];
          setPixelColor(newPng, pixel, color);
      }
    }

    const finalizedPng = resizePng(newPng, height, width );
    response.push( finalizedPng );
  })

  return response;
}

function resizePng( heatMapPng, inputHeight, inputWidth ) : PNG {
  const interpolatedHeight = (inputHeight - 1) * pixelsPerMeter;
  const interpolatedWidth = (inputWidth - 1) * pixelsPerMeter;
  const interpolated = new PNG({
      height: interpolatedHeight,
      width: interpolatedWidth,
  });
  for (let y = 0; y < inputHeight - 1; y++) {
      for (let x = 0; x < inputWidth - 1; x++) {
          const thisColor = getPixelColor(heatMapPng, [x, y]);
          const xColor = getPixelColor(heatMapPng, [x + 1, y]);
          const yColor = getPixelColor(heatMapPng, [x, y + 1]);
          const xyColor = getPixelColor(heatMapPng, [x + 1, y + 1]);
          for (let b = 0; b < pixelsPerMeter; b++) {
              const percentB = b / pixelsPerMeter;
              const leftColor = lerpColor(thisColor, yColor, percentB);
              const rightColor = lerpColor(xColor, xyColor, percentB);
              for (let a = 0; a < pixelsPerMeter; a++) {
                  const pixel: Pixel = [
                      pixelsPerMeter * x + a,
                      pixelsPerMeter * y + b,
                  ];
                  const percentA = a / pixelsPerMeter;
                  const color = lerpColor(leftColor, rightColor, percentA);
                  setPixelColor(interpolated, pixel, color);
              }
          }
      }
  }

  return interpolated
}

function drawHeatmap( layers: any ) : PNG {
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

export async function generateMaskedHeatmapPngs(dataLabel: any, tiffBuffer: any, maskBuffer: any, rgbBuffer: any) : Promise<any> {
  const fluxLayers = await generateLayers( tiffBuffer );
  const maskLayers = await generateLayers( maskBuffer );
  const satelliteLayers = await generateLayers( rgbBuffer );

  let response = Array();
  let fluxPng: PNG;

  const { height, width } = fluxLayers;

  if ( dataLabel === 'annualFlux' ){
    fluxPng = await drawHeatmap( fluxLayers );
  } else if ( dataLabel === 'monthlyFlux' ) {
    fluxPng = await drawMonthlyHeatmap( fluxLayers );
  } else {
    return false;
  }

  console.log( `flux height: ${height} || width: ${width}`);

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

  response.push( maskedPng );

  return response;
}

async function generateLayers( tiffBuffer ) : Promise<any> {
  const tiffArrayBuffer = toArrayBuffer( tiffBuffer );
  const tiff = await GeoTIFF.fromArrayBuffer(tiffArrayBuffer);
  const layers = await tiff.readRasters();

  return layers;
}

async function drawUpscaledHeatmap( layers: any ) : Promise<PNG> {
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