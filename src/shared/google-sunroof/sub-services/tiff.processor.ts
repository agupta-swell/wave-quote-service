import { Injectable } from '@nestjs/common'
import * as geotiff from 'geotiff'
import type { TypedArrayArrayWithDimensions } from 'geotiff'

import { PngGenerator } from './png.generator'

@Injectable()
export class TiffProcessor {
  public async processRgbTiff () {

    return {

    }
  }
}

async function getLayersFromTiffBuffer (tiffBuffer: Buffer) : Promise<TypedArrayArrayWithDimensions> {
  const tiff = await geotiff.fromBuffer(tiffBuffer);
  // We are casting here to narrow the result, because every Google
  // Sunroof tiff that we need to handle is a multi layer tiff, even
  // if there is only one layer (i.e. the return value here will
  // always be an array, even if it is of length 1).
  return await tiff.readRasters() as TypedArrayArrayWithDimensions;
}
