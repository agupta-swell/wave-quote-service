import type {
    Pixel,
  } from '../types'
  
  import * as path from 'path'
  import { Injectable } from '@nestjs/common';
  import * as GeoTIFF from 'geotiff'
  import { chunk } from 'lodash'
  import { PNG } from 'pngjs'
  
  import {
    gray,
    setPixelColor,
    writePngToFile,
  } from '../utils'
  
  @Injectable()
  export class FileGeneratorService {

  //-----------------------------------------------------------------------------
  
  const tiffFilename = path.join(__dirname, 'tiff', 'mask.tiff')
  const pngFilename = path.join(__dirname, 'png', 'mask.png')
  
  //-----------------------------------------------------------------------------
  
  async function run() {
    console.log(`parsing ${tiffFilename}...`)
    const tiff = await GeoTIFF.fromFile(tiffFilename)
    const layers = await tiff.readRasters()
    const { height, width } = layers
    console.log('height', height, 'width', width)
  
    const [layer] = layers
    const image = chunk(layer, width)
  
    console.log('generating rooftopMask...')
    const maskPng = new PNG({ height, width })
  
    for (let y = 0; y < layers.height; y++) {
      for (let x = 0; x < layers.width; x++) {
        const pixel: Pixel = [x, y]
        const value = image[y][x] as number * 255
        const color = gray(value)
        setPixelColor(maskPng, pixel, color)
      }
    }
    console.log(`saving to ${pngFilename}...`)
    await writePngToFile(maskPng, pngFilename)
  }
  
  run().catch((e) => {
    console.error(e)
  })
}
