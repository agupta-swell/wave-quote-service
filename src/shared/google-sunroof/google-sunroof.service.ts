/* eslint-disable no-restricted-syntax */
import * as geotiff from 'geotiff'; /* TODO TEMP */ import type { GeoTIFF } from './sub-services/types'; type ReadRasterResult = GeoTIFF.ReadRasterResult;
import * as https from 'https';
// TODO is `qs` used by any other file? remove dep
import * as qs from 'qs';
import * as path from 'path';
import { Readable, Stream } from 'stream'

import { PNG } from 'pngjs';
import { chunk } from 'lodash';
import { Injectable } from '@nestjs/common';
import { S3Service } from '../aws/services/s3.service';
import { PngGenerator } from './sub-services';
import { LatLng } from './sub-services/types';

import { SystemDesign } from '../../system-designs/system-design.schema';
import {
  IGetRequestResultWithS3UploadResult,
} from './interfaces';

import { writePngToFile } from './utils'

import type { GoogleSunroof } from './sub-services/types'
import { GoogleSunroofGateway } from './sub-services'

const DEBUG = ['yes', 'true', 'on', '1'].includes(process.env.GOOGLE_SUNROOF_DEBUG?.toLowerCase() || 'false');
const DEBUG_FOLDER = path.join(__dirname, 'debug')

@Injectable()
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

  public getRequest<T>(url: string, cacheKey: string): Promise<IGetRequestResultWithS3UploadResult<T>>;

  public getRequest<T>(url: string, cacheKey?: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        if (res.statusCode !== 200) reject(new Error(`${res.statusCode}: ${res.statusMessage}`));

        const chunks: Buffer[] = [];

        if (cacheKey) {
          if (cacheKey.slice(-4) === 'json') {
            res
              .pipe(
                new Stream.Transform({
                  transform(chunk, _, cb) {
                    chunks.push(chunk);
                    cb(null, chunk);
                  },
                }),
              )
              .pipe(
                this.s3Service.putStream(
                  cacheKey,
                  this.GOOGLE_SUNROOF_S3_BUCKET,
                  'application/json',
                  'private',
                  false,
                  (err, data) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    const payloadStr = Buffer.concat(chunks).toString('utf-8');

                    try {
                      resolve({
                        s3Result: data,
                        payload: JSON.parse(payloadStr),
                      });
                    } catch (error) {
                      reject(error);
                    }
                  },
                ),
              );
          } else if (cacheKey.slice(-4) === 'tiff') {
            const dataLabel = cacheKey.slice( 
              cacheKey.lastIndexOf('/') + 1, 
              cacheKey.lastIndexOf('.')
            );

            res
              .pipe(
                new Stream.Transform({
                  transform(chunk, _, cb) {
                    chunks.push(chunk);
                    cb(null, chunk);
                  },
                }),
              )
              .pipe(
                this.s3Service.putStream(
                  cacheKey,
                  this.GOOGLE_SUNROOF_S3_BUCKET,
                  'image/tiff',
                  'private',
                  false,
                  (err, data) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    try {
                      resolve({
                        dataLabel: dataLabel,
                        s3Result: data,
                        payload: Buffer.concat(chunks),
                      });
                    } catch (error) {
                      reject(error);
                    }
                  },
                ),
              );
          }

          return;
        }

        res
          .on('data', chunk => {
            chunks.push(chunk);
          })
          .on('error', reject)
          .on('end', () => {
            const payloadStr = Buffer.concat(chunks).toString('utf-8');
            try {
              resolve({
                payload: JSON.parse(payloadStr),
              });
            } catch (error) {
              reject(error);
            }
          });
      });
    });
  }

  public async getBuilding (lat: number, long: number, cacheKey: string): Promise<GoogleSunroof.Building> {
    const building = await this.googleSunroofGateway.findClosestBuilding(lat, long)
    // TODO don't cache here?
    await this.s3Service.putObject(
      this.GOOGLE_SUNROOF_S3_BUCKET,
      cacheKey,
      JSON.stringify(building, null, 2),
      'application/json; charset=utf-8',
    )
    return building
  }

  public hasS3File(filePath: string): Promise<boolean> {
    return this.s3Service.hasFile(this.GOOGLE_SUNROOF_S3_BUCKET, filePath);
  }

  public async getS3FileAsJson<T>(filePath: string): Promise<T> {
    const buffer = await this.getS3FileAsBuffer(filePath)
    const json = buffer.toString('utf-8')
    return JSON.parse(json);
  }

  // TODO typed Buffer, e.g. Buffer<SolarInfo> ??
  public async getS3FileAsBuffer<T>(filePath: string): Promise<Buffer> {
    const chunks: Buffer[] = [];

    const stream = this.s3Service.getObjectAsReadable(this.GOOGLE_SUNROOF_S3_BUCKET, filePath);

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  private async savePngToS3(pngKey: string, png: PNG) {
    Readable.from(PNG.sync.write(png)).pipe(
      this.s3Service.putStream(
        pngKey,
        this.GOOGLE_SUNROOF_S3_BUCKET,
        'image/png',
        'private',
        false,
        (err, data) => {
          if (err) {
            console.log( err )
            return err;
          }

          try {
            if (DEBUG) console.log(data);

            return({
              s3Result: data,
              payload: png
            });
          } catch (error) {
            console.log( err )
            return (error);
          }
        },
      )
    );
  }

  public async processTiff(tiffPayloadResponse: any, opportunityId: string){
    const tiffBuffer = tiffPayloadResponse.payload;
    const dataLabel = tiffPayloadResponse.dataLabel;

    // TODO don't call this here
    const annualLayers = await readRastersFromTiffBuffer(tiffBuffer);

    let newPng;
    let filename;

    switch (dataLabel) {
      case 'mask':
        filename = 'rootop.mask';
        newPng = PngGenerator.generateMask(annualLayers);
        break;
      case 'rgb':
        filename = 'satellite';
        newPng = PngGenerator.generateSatellite(annualLayers);
        break;
      case 'annualFlux':
        filename = 'heatmap.annual';
        const [fluxLayer] = annualLayers;
        newPng = PngGenerator.generateHeatmap(chunk(fluxLayer, annualLayers.width));
        break;
      default:
        throw new Error(`unknown data label: ${dataLabel}`)
    }

    const pngKey = makePngKey(opportunityId, filename);
    await this.savePngToS3( pngKey, newPng )
    
    if (DEBUG) {
      console.log( `dataLabel: ${dataLabel} || pngKey: ${pngKey}`);
      const pngFilename = path.join(DEBUG_FOLDER, `${filename}.png`);
      await writePngToFile(newPng, pngFilename);
    }

    return newPng
  }

  public async processMonthlyTiff(tiffPayloadResponse: any, opportunityId: string){
    const tiffBuffer = tiffPayloadResponse.payload;
    const dataLabel = tiffPayloadResponse.dataLabel;

    const layers = await readRastersFromTiffBuffer(tiffBuffer);
    const layerPngs = PngGenerator.generateMonthlyHeatmap(layers)

    await Promise.all(layerPngs.map(async (layerPng, layerPngIndex) => {
      const paddedMonthIndex = layerPngIndex < 10 ? `0${layerPngIndex}` : layerPngIndex;
      const filename = `heatmap.month${paddedMonthIndex}`

      const pngKey = makePngKey(opportunityId, filename);
      await this.savePngToS3( pngKey, layerPng )
      
      if (DEBUG) {
        console.log( `dataLabel: ${dataLabel} || pngKey: ${pngKey}`);
        const pngFilename = path.join(DEBUG_FOLDER, `${filename}.png`);
        await writePngToFile(layerPng, pngFilename);
      }
    }))

    return layerPngs
  }

  public async processMaskedHeatmapPng(filename: string, heatmapPng: PNG, opportunityId: string, maskPng: PNG, maskTiffResponse: any, rgbPng: PNG){
    const [layer] = await readRastersFromTiffBuffer( maskTiffResponse.payload );
    const maskLayer = chunk(layer, maskPng.width);
    const annualFluxMaskedPng = await PngGenerator.applyMaskedOverlay( heatmapPng, maskLayer, rgbPng);
    const pngKey = makePngKey( opportunityId, filename );

    await this.savePngToS3( pngKey, annualFluxMaskedPng )
    
    if (DEBUG) {
      console.log( `filename: ${filename} || pngKey: ${pngKey}`);
      const pngFilename = path.join(DEBUG_FOLDER, `${filename}.png`);
      await writePngToFile( annualFluxMaskedPng, pngFilename );
    }

    return true;
  }

  public async generateHeatmapPngs (systemDesign: SystemDesign) : Promise<void> {
    const { latitude, longitude, opportunityId } = systemDesign

    // TODO TEMP hardcode radius meters for now
    // TODO TEMP this should be calculated from the arrays
    const radiusMeters = 25

    const solarInfo = await this.googleSunroofGateway.getSolarInfo(latitude, longitude, radiusMeters)
    await this.s3Service.putObject(
      this.GOOGLE_SUNROOF_S3_BUCKET,
      `${opportunityId}/solarInfo.json`,
      JSON.stringify(solarInfo, null, 2),
      'application/json; charset=utf-8',
    )

    const rgbUrl = solarInfo.rgbUrl;
    const rgbFilename = `${opportunityId}/tiff/rgb.tiff`;
    const rgbTiffResponse = await this.getRequest(rgbUrl, rgbFilename);
    const rgbPng = await this.processTiff(rgbTiffResponse, opportunityId);

    const maskUrl = solarInfo.maskUrl;
    const maskFilename = `${opportunityId}/tiff/mask.tiff`;
    const maskTiffResponse = await this.getRequest(maskUrl, maskFilename);
    const maskPng = await this.processTiff(maskTiffResponse, opportunityId);

    const annualFluxUrl = solarInfo.annualFluxUrl;
    const annualFluxFilename = `${opportunityId}/tiff/annualFlux.tiff`;
    const annualFluxTiffResponse = await this.getRequest(annualFluxUrl, annualFluxFilename);
    const annualFluxPng = await this.processTiff(annualFluxTiffResponse, opportunityId);

    await this.processMaskedHeatmapPng( 'heatmap.masked.annual', annualFluxPng, opportunityId, maskPng, maskTiffResponse, rgbPng );

    const monthlyFluxUrl = solarInfo.monthlyFluxUrl;
    const monthlyFluxFilename = `${opportunityId}/tiff/monthlyFlux.tiff`;
    const monthlyFluxTiffResponse = await this.getRequest(monthlyFluxUrl, monthlyFluxFilename);
    const monthlyPngs = await this.processMonthlyTiff(monthlyFluxTiffResponse, opportunityId);

    await Promise.all( monthlyPngs.map( async (monthlyPng, index)  => {
      const monthIndex = index < 10 ? `0${index}` : `${index}`;
      await this.processMaskedHeatmapPng(
        `heatmap.masked.month${monthIndex}`,
        monthlyPng,
        opportunityId,
        maskPng,
        maskTiffResponse,
        rgbPng
      );
    }));
  }

  public async generateOverlayPng (systemDesign: SystemDesign) : Promise<void> {
    const annualFluxTiffFilePath = `${systemDesign.opportunityId}/tiff/annualFlux.tiff`;
    const annualFluxTiff = await this.getS3FileAsBuffer(annualFluxTiffFilePath);
    const tiffLayers = await readRastersFromTiffBuffer( annualFluxTiff );

    const { height, width } = tiffLayers;
    const pixelsPerMeter = 10;

    const { latitude, longitude, opportunityId } = systemDesign;
    const { roofTopDesignData: { panelArray: arrays }} = systemDesign;

    const origin: LatLng = { lat: latitude, lng: longitude };
    const filenamePrefix = `${opportunityId}/`;
    const filename = 'array.overlay'

    const arrayPng = await PngGenerator.generateArrayPng(arrays,  origin, pixelsPerMeter, height, width);

    await this.savePngToS3( `${filenamePrefix}${filename}.png`, arrayPng );

    if (DEBUG) {
      const pngFilename = path.join(DEBUG_FOLDER, `${filename}.png`);
      await writePngToFile(arrayPng, pngFilename);
    }

    // placeholder for production calculation WAV-1700
  }
}

function makePngKey (opportunityId: string, pngFilename: string) : string {
  return `${opportunityId}/png/${pngFilename}.png`
}


async function readRastersFromTiffBuffer (buffer: Buffer) : Promise<ReadRasterResult> {
  // TODO A future release of `geotiff` will hopefully support `fromBuffer(...)`
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer);
  return await tiff.readRasters() as ReadRasterResult;
}
