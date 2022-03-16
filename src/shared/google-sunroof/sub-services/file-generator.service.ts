/* eslint-disable no-plusplus */
/* eslint-disable no-console */
import * as path from 'path';
const GeoTIFF = require('geotiff');
import { chunk } from 'lodash';
import { PNG } from 'pngjs';
import { S3Service } from '../../aws/services/s3.service';
import type { Pixel } from '../types';
import { gray, setPixelColor, toArrayBuffer, writePngToFile } from '../utils';

async function savePng() {

}

export async function generatePng(tiffName: any, tiffBuffer: any) {
  const pngFilename = path.join(__dirname, 'png', `${tiffName}.png`);
  console.log( Buffer.isBuffer( tiffBuffer ) );

  const tiffArrayBuffer = toArrayBuffer( tiffBuffer );
  const tiff = await GeoTIFF.fromArrayBuffer(tiffArrayBuffer);
  
  const layers = await tiff.readRasters();
  const { height, width } = layers;
  console.log('height', height, 'width', width);

  const [layer] = layers;
  const image = chunk(layer, width);

  console.log('generating rooftopMask...');
  const maskPng = new PNG({ height, width });

  for (let y = 0; y < layers.height; y++) {
    for (let x = 0; x < layers.width; x++) {
      const pixel: Pixel = [x, y];
      const value = (image[y][x] as number) * 255;
      const color = gray(value);
      setPixelColor(maskPng, pixel, color);
    }
  }

  return maskPng;  
}

