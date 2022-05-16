/* eslint-disable no-restricted-syntax */
// import * as https from 'https';
import * as path from 'path';
// import { Readable, Stream } from 'stream'

import axios from 'axios';
import * as geotiff from 'geotiff';
import type { TypedArrayArrayWithDimensions } from 'geotiff';
import { PNG } from 'pngjs';
import { chunk } from 'lodash';
import { Injectable } from '@nestjs/common';

import { S3Service } from '../aws/services/s3.service';
import { SystemDesign } from '../../system-designs/system-design.schema';
import type { LatLng, GoogleSunroof } from './sub-services/types'
import { PngGenerator, GoogleSunroofGateway } from './sub-services'
import { writePngToFile } from './utils'
import { DAY_COUNT_BY_MONTH_INDEX } from './constants'
import {
  calcCoordinatesDistance,
  ICoordinate,
  isCoordinatesInsideBoundByAtLeast,
} from '../../utils/calculate-coordinates'

const DEBUG = ['yes', 'true', 'on', '1'].includes(process.env.GOOGLE_SUNROOF_DEBUG?.toLowerCase() || 'false');
const DEBUG_FOLDER = path.join(__dirname, 'debug')

type GoogleSunroofOrientationInformation = {
  sunroofPrimaryOrientationSide?: number;
  sunroofPitch?: number;
  sunroofAzimuth?: number;
}

@Injectable()
// TODO move S3 functions to S3 service?
export class GoogleSunroofService {
  private readonly GOOGLE_SUNROOF_S3_BUCKET: string;

  constructor(
    private readonly googleSunroofGateway: GoogleSunroofGateway,
    private readonly s3Service: S3Service,
  ) {
    const bucket = process.env.GOOGLE_SUNROOF_S3_BUCKET;
    if (!bucket) throw new Error('Missing GOOGLE_SUNROOF_S3_BUCKET environment variable');
    this.GOOGLE_SUNROOF_S3_BUCKET = bucket;
  }

  // public getRequest<T>(url: string, cacheKey?: string): Promise<Object> {
  //   return new Promise((resolve, reject) => {
  //     https.get(url, res => {
  //       if (res.statusCode !== 200) reject(new Error(`${res.statusCode}: ${res.statusMessage}`));
  //
  //       const chunks: Buffer[] = [];
  //
  //       if (cacheKey) {
  //         if (cacheKey.slice(-4) === 'json') {
  //           res
  //             .pipe(
  //               new Stream.Transform({
  //                 transform(chunk, _, cb) {
  //                   chunks.push(chunk);
  //                   cb(null, chunk);
  //                 },
  //               }),
  //             )
  //             .pipe(
  //               this.s3Service.putStream(
  //                 cacheKey,
  //                 this.GOOGLE_SUNROOF_S3_BUCKET,
  //                 'application/json',
  //                 'private',
  //                 false,
  //                 (err, data) => {
  //                   if (err) {
  //                     reject(err);
  //                     return;
  //                   }
  //
  //                   const payloadStr = Buffer.concat(chunks).toString('utf-8');
  //
  //                   try {
  //                     resolve({
  //                       s3Result: data,
  //                       payload: JSON.parse(payloadStr),
  //                     });
  //                   } catch (error) {
  //                     reject(error);
  //                   }
  //                 },
  //               ),
  //             );
  //         } else if (cacheKey.slice(-4) === 'tiff') {
  //           const dataLabel = cacheKey.slice(
  //             cacheKey.lastIndexOf('/') + 1,
  //             cacheKey.lastIndexOf('.')
  //           );
  //
  //           res
  //             .pipe(
  //               new Stream.Transform({
  //                 transform(chunk, _, cb) {
  //                   chunks.push(chunk);
  //                   cb(null, chunk);
  //                 },
  //               }),
  //             )
  //             .pipe(
  //               this.s3Service.putStream(
  //                 cacheKey,
  //                 this.GOOGLE_SUNROOF_S3_BUCKET,
  //                 'image/tiff',
  //                 'private',
  //                 false,
  //                 (err, data) => {
  //                   if (err) {
  //                     reject(err);
  //                     return;
  //                   }
  //
  //                   try {
  //                     resolve({
  //                       dataLabel: dataLabel,
  //                       s3Result: data,
  //                       payload: Buffer.concat(chunks),
  //                     });
  //                   } catch (error) {
  //                     reject(error);
  //                   }
  //                 },
  //               ),
  //             );
  //         }
  //
  //         return;
  //       }
  //
  //       res
  //         .on('data', chunk => {
  //           chunks.push(chunk);
  //         })
  //         .on('error', reject)
  //         .on('end', () => {
  //           const payloadStr = Buffer.concat(chunks).toString('utf-8');
  //           try {
  //             resolve({
  //               payload: JSON.parse(payloadStr),
  //             });
  //           } catch (error) {
  //             reject(error);
  //           }
  //         });
  //     });
  //   });
  // }

  /**
   * Check S3 for the cached `closestBuilding.json` file for the given opportunityId.
   * Fetch, ans cache, it from Google Sunroof if the file does not already exist.
   *
   * @param opportunityId
   * @param latitude
   * @param longitude
   */
  public async getClosestBuilding (
    opportunityId: string,
    latitude: number,
    longitude: number,
  ) : Promise<GoogleSunroof.Building> {
    const key = `${opportunityId}/closestBuilding.json`
    let closestBuilding = await this.getS3FileAsJson<GoogleSunroof.Building>(key)
    if (!closestBuilding) {
      closestBuilding = await this.googleSunroofGateway.findClosestBuilding(latitude, longitude)
      await this.saveObjectAsJsonToS3(closestBuilding, key)
    }
    return closestBuilding
  }

  /**
   * For the given system design details, determine the appropriate array polygon azimuth side,
   * pitch (degrees), and azimuth (degrees) based on the available closestBuilding data.
   *
   * Returns an empty object if there is a problem.
   *
   * @param opportunityId
   * @param latitude
   * @param longitude
   * @param centerLat
   * @param centerLng
   * @param sideAzimuths
   * @param polygons
   */
  public async getOrientationInformation (
    opportunityId: string,
    latitude: number,
    longitude: number,
    centerLat: number,
    centerLng: number,
    sideAzimuths: number[],
    polygons: ICoordinate[],
  ) : Promise<GoogleSunroofOrientationInformation> {
    const closestBuilding = await this.getClosestBuilding(opportunityId, latitude, longitude);

    if (!Array.isArray(closestBuilding?.solarPotential?.roofSegmentStats)) {
      return {};
    }

    const segmentsContainPanel = closestBuilding.solarPotential.roofSegmentStats.filter(segment =>
      isCoordinatesInsideBoundByAtLeast(polygons, {
        ne: {
          lat: segment.boundingBox.ne.latitude,
          lng: segment.boundingBox.ne.longitude,
        },
        sw: {
          lat: segment.boundingBox.sw.latitude,
          lng: segment.boundingBox.sw.longitude,
        },
      }),
    );

    let closestSegment: GoogleSunroof.Building['solarPotential']['roofSegmentStats'][number];

    if (segmentsContainPanel.length === 1) {
      const [segment] = segmentsContainPanel;

      closestSegment = segment;
    } else
      closestSegment = (segmentsContainPanel.length
          ? segmentsContainPanel
          : closestBuilding.solarPotential.roofSegmentStats
      )
        .map(e => {
          const distance = calcCoordinatesDistance(
            {
              lat: centerLat,
              lng: centerLng,
            },
            {
              lat: e.center.latitude,
              lng: e.center.longitude,
            },
          );

          return {
            ...e,
            distance,
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];

    if (!closestSegment.azimuthDegrees) {
      return {};
    }

    const closestSide = sideAzimuths
      .map((e, idx) => ({
        side: idx + 1,
        val: Math.abs(closestSegment.azimuthDegrees - e),
      }))
      .sort((a, b) => a.val - b.val)[0].side;

    return {
      sunroofPrimaryOrientationSide: closestSide,
      sunroofPitch: closestSegment.pitchDegrees,
      sunroofAzimuth: closestSegment.azimuthDegrees,
    };
  }

  // TODO Temp check callers of this method. rename method
  // public async getBuilding (lat: number, long: number, cacheKey: string): Promise<GoogleSunroof.Building> {
  //   const building = await this.googleSunroofGateway.findClosestBuilding(lat, long)
  //   // TODO don't cache here?
  //   await this.s3Service.putObject(
  //     this.GOOGLE_SUNROOF_S3_BUCKET,
  //     cacheKey,
  //     JSON.stringify(building, null, 2),
  //     'application/json; charset=utf-8',
  //   )
  //   return building
  // }

  // TODO Temp remove this. use optimistic fetching.
  // public hasS3File(filePath: string): Promise<boolean> {
  //   return this.s3Service.hasFile(this.GOOGLE_SUNROOF_S3_BUCKET, filePath);
  // }

  // public async processTiff(tiffPayloadResponse: any, opportunityId: string){
  //   const tiffBuffer = tiffPayloadResponse.payload;
  //   const dataLabel = tiffPayloadResponse.dataLabel;
  //
  //   // TODO don't call this here
  //   const annualLayers = await getLayersFromTiffBuffer(tiffBuffer);
  //
  //   let newPng;
  //   let filename;
  //
  //   switch (dataLabel) {
  //     case 'mask':
  //       filename = 'rootop.mask';
  //       newPng = PngGenerator.generateBlackAndWhitePng(annualLayers);
  //       break;
  //     case 'rgb':
  //       filename = 'satellite';
  //       newPng = PngGenerator.generateRgbPng(annualLayers);
  //       break;
  //     case 'annualFlux':
  //       filename = 'heatmap.annual';
  //       const [fluxLayer] = annualLayers;
  //       newPng = PngGenerator.generateHeatmapPng(chunk(fluxLayer, annualLayers.width));
  //       break;
  //     default:
  //       throw new Error(`unknown data label: ${dataLabel}`)
  //   }
  //
  //   const pngKey = makePngKey(opportunityId, filename);
  //   await this.oldSavePngToS3(newPng, pngKey)
  //
  //   if (DEBUG) {
  //     console.log( `dataLabel: ${dataLabel} || pngKey: ${pngKey}`);
  //     const pngFilename = path.join(DEBUG_FOLDER, `${filename}.png`);
  //     await writePngToFile(newPng, pngFilename);
  //   }
  //
  //   return newPng
  // }
  //
  // public async processMonthlyTiff(tiffPayloadResponse: any, opportunityId: string){
  //   const tiffBuffer = tiffPayloadResponse.payload;
  //   const dataLabel = tiffPayloadResponse.dataLabel;
  //
  //   const layers = await getLayersFromTiffBuffer(tiffBuffer);
  //   const layerPngs = PngGenerator.generateMonthlyHeatmap(layers)
  //
  //   await Promise.all(layerPngs.map(async (layerPng, layerPngIndex) => {
  //     const paddedMonthIndex = layerPngIndex < 10 ? `0${layerPngIndex}` : layerPngIndex;
  //     const filename = `heatmap.month${paddedMonthIndex}`
  //
  //     const pngKey = makePngKey(opportunityId, filename);
  //     await this.oldSavePngToS3(layerPng, pngKey)
  //
  //     if (DEBUG) {
  //       console.log( `dataLabel: ${dataLabel} || pngKey: ${pngKey}`);
  //       const pngFilename = path.join(DEBUG_FOLDER, `${filename}.png`);
  //       await writePngToFile(layerPng, pngFilename);
  //     }
  //   }))
  //
  //   return layerPngs
  // }

  // public async processMaskedHeatmapPng(filename: string, heatmapPng: PNG, opportunityId: string, maskPng: PNG, maskTiffResponse: any, rgbPng: PNG){
  //   const [layer] = await getLayersFromTiffBuffer( maskTiffResponse.payload );
  //   const maskLayer = chunk(layer, maskPng.width);
  //   const annualFluxMaskedPng = await PngGenerator.applyMaskedOverlay( heatmapPng, rgbPng, maskLayer);
  //   const pngKey = makePngKey( opportunityId, filename );
  //
  //   await this.oldSavePngToS3(annualFluxMaskedPng, pngKey)
  //
  //   if (DEBUG) {
  //     console.log( `filename: ${filename} || pngKey: ${pngKey}`);
  //     const pngFilename = path.join(DEBUG_FOLDER, `${filename}.png`);
  //     await writePngToFile( annualFluxMaskedPng, pngFilename );
  //   }
  //
  //   return true;
  // }

  /**
   * TODO document this
   * TODO improve debugging
   *
   * @param systemDesign
   */
  public async generateHeatmapPngs (systemDesign: SystemDesign) : Promise<void> {
    const { latitude, longitude, opportunityId } = systemDesign

    // TODO TEMP hardcoding radius meters for now
    // TODO TEMP this should be calculated from the arrays
    const radiusMeters = 25

    const solarInfo = await this.googleSunroofGateway.getSolarInfo(latitude, longitude, radiusMeters)

    const savingSolarInfoJsonToS3 = this.saveObjectAsJsonToS3(solarInfo, `${opportunityId}/solarInfo.json`)

    const {
      rgbUrl,
      maskUrl,
      annualFluxUrl,
      monthlyFluxUrl,
    } = solarInfo

    const downloadingRgbTiffBuffer = downloadFileAsBuffer(rgbUrl)
    const downloadingMaskTiffBuffer = downloadFileAsBuffer(maskUrl)
    const downloadingAnnualFluxTiffBuffer = downloadFileAsBuffer(annualFluxUrl)
    const downloadingMonthlyFluxTiffBuffer = downloadFileAsBuffer(monthlyFluxUrl)

    const savingRgbTiffToS3 = downloadingRgbTiffBuffer.then(async rgbTiffBuffer => {
      await this.saveTiffToS3(rgbTiffBuffer, `${opportunityId}/tiff/rgb.tiff`)
    })
    const savingMaskTiffToS3 = downloadingMaskTiffBuffer.then(async maskTiffBuffer => {
      await this.saveTiffToS3(maskTiffBuffer, `${opportunityId}/tiff/mask.tiff`)
    })
    const savingAnnualFluxTiffToS3 = downloadingAnnualFluxTiffBuffer.then(async annualFluxTiffBuffer => {
      await this.saveTiffToS3(annualFluxTiffBuffer, `${opportunityId}/tiff/annualFlux.tiff`)
    })
    const savingMonthlyFluxTiffToS3 = downloadingMonthlyFluxTiffBuffer.then(async monthlyFluxTiffBuffer => {
      await this.saveTiffToS3(monthlyFluxTiffBuffer, `${opportunityId}/tiff/monthlyFlux.tiff`)
    })

    const generatingSatellitePng = downloadingRgbTiffBuffer.then(async rgbTiffBuffer => {
      const rgbLayers = await getLayersFromTiffBuffer(rgbTiffBuffer)
      return PngGenerator.generateRgbPng(rgbLayers)
    })

    const savingSatellitePngToS3 = generatingSatellitePng.then(async satellitePng => {
      await this.savePngToS3(satellitePng, `${opportunityId}/png/satellite.png`)
    })

    const gettingLayersFromMaskTiffBuffer = downloadingMaskTiffBuffer.then(maskTiffBuffer => {
      return getLayersFromTiffBuffer(maskTiffBuffer)
    })

    const gettingMask = gettingLayersFromMaskTiffBuffer.then(maskLayers => {
      const {
        0: maskLayer, // the mask tiff has only one layer
        width,
      } = maskLayers
      return chunk(maskLayer, width)
    })

    const generatingMaskPng = gettingLayersFromMaskTiffBuffer.then(maskLayers => {
      return PngGenerator.generateBlackAndWhitePng(maskLayers)
    })

    const savingMaskPngToS3 = generatingMaskPng.then(async maskPng => {
      await this.savePngToS3(maskPng, `${opportunityId}/png/mask.png`)
    })

    const generatingAnnualHeatmapPng = downloadingAnnualFluxTiffBuffer.then(async annualFluxTiffBuffer => {
      const {
        0: annualFluxLayer, // the annual flux tiff has only one layer
        width,
      } = await getLayersFromTiffBuffer(annualFluxTiffBuffer)
      const annualFlux = chunk(annualFluxLayer, width)
      return PngGenerator.generateHeatmapPng(annualFlux)
    })

    const savingAnnualHeatmapPngToS3 = generatingAnnualHeatmapPng.then(async annualHeatmapPng => {
      await this.savePngToS3(annualHeatmapPng, `${opportunityId}/png/heatmap.annual.png`)
    })

    const generatingAnnualMaskedHeatmapPng = Promise.all([
      generatingAnnualHeatmapPng,
      generatingSatellitePng,
      gettingMask,
    ]).then(([
      annualHeatmapPng,
      satellitePng,
      mask,
    ]) => {
      return PngGenerator.applyMaskedOverlay(annualHeatmapPng, satellitePng, mask)
    })

    const savingAnnualMaskedHeatmapPngToS3 = generatingAnnualMaskedHeatmapPng.then(async annualMaskedHeatmapPng => {
      await this.savePngToS3(annualMaskedHeatmapPng, `${opportunityId}/png/heatmap.annual.masked.png`)
    })

    const savingAllMonthlyPngsToS3 = downloadingMonthlyFluxTiffBuffer.then(async monthlyFluxTiffBuffer => {
      const monthlyFluxLayers = await getLayersFromTiffBuffer(monthlyFluxTiffBuffer)
      const { width } = monthlyFluxLayers
      await Promise.all(monthlyFluxLayers.map(async (monthlyFluxLayer, monthIndex) => {
        const annualScalingFactor = 365 / DAY_COUNT_BY_MONTH_INDEX[monthIndex]
        const annualizedFluxLayer = monthlyFluxLayer.map(x => x * annualScalingFactor)
        const flux = chunk(annualizedFluxLayer, width)

        let heatmapPng = PngGenerator.generateHeatmapPng(flux)
        heatmapPng = PngGenerator.upscalePng(heatmapPng, 5)

        const savingHeatmapPngToS3 = this.savePngToS3(heatmapPng, `${opportunityId}/png/heatmap.month${monthIndex}.png`)

        const generatingMaskedHeatmapPng = Promise.all([
          generatingSatellitePng,
          gettingMask,
        ]).then(([
          satellitePng,
          mask,
        ]) => {
          return PngGenerator.applyMaskedOverlay(heatmapPng, satellitePng, mask)
        })

        const savingMaskHeatmapPngToS3 = generatingMaskedHeatmapPng.then(async maskedHeatmapPng => {
          await this.savePngToS3(maskedHeatmapPng, `${opportunityId}/png/heatmap.month${monthIndex}.masked.png`)
        })

        await Promise.all([
          savingHeatmapPngToS3,
          savingMaskHeatmapPngToS3,
        ])
      }))
    })

    await Promise.all([
      savingSolarInfoJsonToS3,
      savingRgbTiffToS3,
      savingMaskTiffToS3,
      savingAnnualFluxTiffToS3,
      savingMonthlyFluxTiffToS3,
      savingSatellitePngToS3,
      savingMaskPngToS3,
      savingAnnualHeatmapPngToS3,
      savingAnnualMaskedHeatmapPngToS3,
      savingAllMonthlyPngsToS3,
    ])

    // const rgbFilename = `${opportunityId}/tiff/rgb.tiff`;
    // const rgbTiffResponse = await this.getRequest(rgbUrl, rgbFilename);
    // const rgbPng = await this.processTiff(rgbTiffResponse, opportunityId);
    //
    // const maskFilename = `${opportunityId}/tiff/mask.tiff`;
    // const maskTiffResponse = await this.getRequest(maskUrl, maskFilename);
    // const maskPng = await this.processTiff(maskTiffResponse, opportunityId);
    //
    // const annualFluxFilename = `${opportunityId}/tiff/annualFlux.tiff`;
    // const annualFluxTiffResponse = await this.getRequest(annualFluxUrl, annualFluxFilename);
    // const annualFluxPng = await this.processTiff(annualFluxTiffResponse, opportunityId);
    //
    // await this.processMaskedHeatmapPng( 'heatmap.masked.annual', annualFluxPng, opportunityId, maskPng, maskTiffResponse, rgbPng );
    //
    // const monthlyFluxFilename = `${opportunityId}/tiff/monthlyFlux.tiff`;
    // const monthlyFluxTiffResponse = await this.getRequest(monthlyFluxUrl, monthlyFluxFilename);
    // const monthlyPngs = await this.processMonthlyTiff(monthlyFluxTiffResponse, opportunityId);
    //
    // await Promise.all( monthlyPngs.map( async (monthlyPng, index)  => {
    //   const monthIndex = index < 10 ? `0${index}` : `${index}`;
    //   await this.processMaskedHeatmapPng(
    //     `heatmap.masked.month${monthIndex}`,
    //     monthlyPng,
    //     opportunityId,
    //     maskPng,
    //     maskTiffResponse,
    //     rgbPng
    //   );
    // }));
  }

  /**
   * TODO document this
   *
   * @param systemDesign
   */
  public async generateArrayOverlayPng (systemDesign: SystemDesign) : Promise<void> {
    const {
      latitude,
      longitude,
      opportunityId,
      roofTopDesignData: {
        panelArray: arrays,
      },
    } = systemDesign;

    // fetch the annual flux tiff for this opportunity to get the dimensions for the overlay png
    const annualFluxTiffBuffer = await this.getS3FileAsBuffer(`${opportunityId}/tiff/annualFlux.tiff`);
    if (!annualFluxTiffBuffer) {
      throw new Error('Cannot generate array overlay PNG before GeoTIFFs have been downloaded!')
    }
    const tiffLayers = await getLayersFromTiffBuffer(annualFluxTiffBuffer);
    const { height, width } = tiffLayers;

    // the annual flux tiff has a resolution of 10 pixels per meter
    const pixelsPerMeter = 10;

    const arrayPng = PngGenerator.generateArrayOverlayPng(
      height,
      width,
      {
        lat: latitude,
        lng: longitude,
      },
      pixelsPerMeter,
      arrays,
    );

    await this.savePngToS3(arrayPng, `${opportunityId}/png/array.overlay.png`);

    // placeholder for production calculation WAV-1700
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Private S3 helper functions

  /**
   * Reads an S3 object and parse is as JSON.
   * Returns null if the object does not exist.
   * Throws a SyntaxError if the object is not valid JSON.
   *
   * @param key
   * @private
   * @throws SyntaxError
   */
  private async getS3FileAsJson<T> (key: string): Promise<T | null> {
    const buffer = await this.getS3FileAsBuffer(key)
    if (!buffer) return null
    const json = buffer.toString('utf-8')
    return JSON.parse(json)
  }

  /**
   * Reads an S3 object into a NodeJS Buffer.
   * Returns null if the object does not exist.
   *
   * @param key
   * @private
   */
  private async getS3FileAsBuffer (key: string): Promise<Buffer | null> {
    const stream = this.s3Service.getObjectAsReadable(this.GOOGLE_SUNROOF_S3_BUCKET, key)
    const chunks: Buffer[] = []
    try {
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
    } catch (_) {
      // any error, such as NoSuchKey (file not found)
      return null
    }
    return Buffer.concat(chunks)
  }

  /**
   * Stringify the given object into S3 with an `application/json` MIME type.
   *
   * @param obj
   * @param key
   * @private
   */
  private async saveObjectAsJsonToS3 (obj: Object, key: string) : Promise<void> {
    await this.s3Service.putObject(
      this.GOOGLE_SUNROOF_S3_BUCKET,
      key,
      JSON.stringify(obj, null, 2),
      'application/json; charset=utf-8',
    )
  }

  /**
   * Save the given Buffer to S3 with an `image/tiff` MIME type.
   *
   * @param tiffBuffer
   * @param key
   * @private
   */
  private async saveTiffToS3 (tiffBuffer: Buffer, key: string) : Promise<void> {
    await this.s3Service.putObject(
      this.GOOGLE_SUNROOF_S3_BUCKET,
      key,
      tiffBuffer,
      'image/tiff',
    )
  }

  /**
   * Serialize a PNG into S3 with an `image/png` MIME type.
   *
   * @param png
   * @param key
   * @private
   */
  private async savePngToS3 (png: PNG, key: string) : Promise<void> {
    await this.s3Service.putObject(
      this.GOOGLE_SUNROOF_S3_BUCKET,
      key,
      PNG.sync.write(png),
      'image/png',
    )
  }

  // TODO delete this
  // private async oldSavePngToS3(png: PNG, key: string) {
  //   Readable.from(PNG.sync.write(png)).pipe(
  //     this.s3Service.putStream(
  //       key,
  //       this.GOOGLE_SUNROOF_S3_BUCKET,
  //       'image/png',
  //       'private',
  //       false,
  //       (err, data) => {
  //         if (err) {
  //           console.log( err )
  //           return err;
  //         }
  //
  //         try {
  //           if (DEBUG) console.log(data);
  //
  //           return({
  //             s3Result: data,
  //             payload: png
  //           });
  //         } catch (error) {
  //           console.log( err )
  //           return (error);
  //         }
  //       },
  //     )
  //   );
  // }
}

// function makePngKey (opportunityId: string, pngFilename: string) : string {
//   return `${opportunityId}/png/${pngFilename}.png`
// }

async function downloadFileAsBuffer (url: string) : Promise<Buffer> {
  const { data } = await axios.get<Buffer>(url, { responseType: 'arraybuffer' })
  return data
}

async function getLayersFromTiffBuffer (tiffBuffer: Buffer) : Promise<TypedArrayArrayWithDimensions> {
  const tiff = await geotiff.fromBuffer(tiffBuffer);
  // We are casting here to narrow the result, because every Google
  // Sunroof tiff that we need to handle is a multi layer tiff, even
  // if there is only one layer (i.e. the return value here will
  // always be an array, even if it is of length 1).
  return await tiff.readRasters() as TypedArrayArrayWithDimensions;
}
