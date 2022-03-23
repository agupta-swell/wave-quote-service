/* eslint-disable no-restricted-syntax */
import * as https from 'https';
import * as qs from 'qs';
import * as path from 'path';
import { Readable } from 'stream';
import { PNG } from 'pngjs';
import { Injectable } from '@nestjs/common';
import { Stream } from 'stream';
import { S3Service } from '../aws/services/s3.service';
import { generatePng, generateMonthlyPngs, generateMaskedHeatmapPngs } from './sub-services/file-generator.service';
import { SUNROOF_API } from './constants';
import {
  IGetBuildingResult,
  IGetSolarInfoResult,
  IGetRequestResult,
  IGetRequestResultWithS3UploadResult,
} from './interfaces';
import { writePngToFile } from './utils';

@Injectable()
export class GoogleSunroofService {
  private readonly GOOGLE_SUNROOF_BUCKET: string;

  private readonly API_KEY: string;

  constructor(private readonly s3Service: S3Service) {
    const bucket = process.env.SUNROOF_AWS_BUCKET;

    if (!bucket) throw new Error('Missing sunroof aws s3 bucket');

    this.GOOGLE_SUNROOF_BUCKET = bucket;

    const apiKey = process.env.SUNROOF_API_KEY;

    if (!apiKey) throw new Error('Missing sunroof api key');

    this.API_KEY = apiKey;
  }

  private makeGetUrl(query: Record<string, unknown>, ...path: string[]): string {
    const url = [SUNROOF_API.HOST, SUNROOF_API.VERSION, ...path].join('/');

    if (!query || !Object.keys(query).length) return url;

    const params = qs.stringify({ ...query, key: this.API_KEY });

    return `${url}?${params}`;
  }

  public getRequest<T>(url: string): Promise<IGetRequestResult<T>>;

  public getRequest<T>(url: string, cacheKey: string): Promise<IGetRequestResultWithS3UploadResult<T>>;

  public getRequest<T>(url: string, cacheKey?: string): Promise<any> {
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
                  this.GOOGLE_SUNROOF_BUCKET,
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
                  this.GOOGLE_SUNROOF_BUCKET,
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

  public getBuilding(lat: number, long: number): Promise<IGetRequestResult<IGetBuildingResult>>;

  public getBuilding(
    lat: number,
    long: number,
    cacheKey: string,
  ): Promise<IGetRequestResultWithS3UploadResult<IGetBuildingResult>>;

  public getBuilding(lat: number, long: number, cacheKey?: string): Promise<any> {
    const url = this.makeGetUrl(
      {
        'location.latitude': lat,
        'location.longitude': long,
      },
      SUNROOF_API.BUILDINGS_FIND_CLOSEST,
    );

    return this.getRequest<IGetBuildingResult>(url, cacheKey!);
  }

  public hasS3File(filePath: string): Promise<boolean> {
    return this.s3Service.hasFile(this.GOOGLE_SUNROOF_BUCKET, filePath);
  }

  public async getS3File<T>(filePath: string): Promise<T> {
    const chunks: Buffer[] = [];

    const stream = this.s3Service.getObjectAsReadable(this.GOOGLE_SUNROOF_BUCKET, filePath);

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const payloadStr = Buffer.concat(chunks).toString('utf-8');

    return JSON.parse(payloadStr);
  }

  public getSolarInfo(lat: number, long: number, radiusMeters: number): Promise<IGetRequestResult<IGetSolarInfoResult>>;

  public getSolarInfo(
    lat: number,
    long: number,
    radiusMeters: number,
    cacheKey: string,
  ): Promise<IGetRequestResultWithS3UploadResult<IGetSolarInfoResult>>;

  public getSolarInfo(lat: number, long: number, radiusMeters: number, cacheKey?: string): Promise<any> {
    const url = this.makeGetUrl(
      {
        'location.latitude': lat,
        'location.longitude': long,
        radiusMeters,
      },
      SUNROOF_API.SOLAR_INFO_GET,
    );

    return this.getRequest<IGetSolarInfoResult>(url, cacheKey!);
  }

  private savePngToS3( pngKey, png ) {
    Readable.from(PNG.sync.write(png)).pipe(
      this.s3Service.putStream(
        pngKey,
        this.GOOGLE_SUNROOF_BUCKET,
        'image/png',
        'private',
        false,
        (err, data) => {
          if (err) {
            console.log( err )
            return err;
          }

          const pngFile = png;

          try {
            console.log( data );

            return({
              s3Result: data,
              payload: pngFile
            });
          } catch (error) {
            console.log( err )
            return (error);
          }
        },
      )
    );

  }

  private setPngKey( tiffKey, dataLabel ){
    return tiffKey.slice( 0, tiffKey.indexOf('/') ) 
    + '/png/'
    + dataLabel
    + '.png';
  }

  public async stagePngs( tiffPayloadResponses ){
    const maskTiffPayloadResponse = tiffPayloadResponses.find((element) => element.dataLabel === 'mask');

    // const maskCarton = await this.stagePng( maskTiffPayloadResponse );
    this.stagePng( maskTiffPayloadResponse );

    const rgbTiffPayloadResponse = tiffPayloadResponses.find((element) => element.dataLabel === 'rgb');

    // const rgbCarton = await this.stagePng( rgbTiffPayloadResponse );
    this.stagePng( rgbTiffPayloadResponse );

    const annualFluxTiffPayloadResponse = tiffPayloadResponses.find((element) => element.dataLabel === 'annualFlux');
    
    const annualHeatmapPng = await this.stagePng( annualFluxTiffPayloadResponse );
    this.stageMaskedHeatmapPng( 'heatmap.annual.masked', annualHeatmapPng, annualFluxTiffPayloadResponse, maskTiffPayloadResponse, rgbTiffPayloadResponse );


    const monthlyFluxTiffPayloadResponse = tiffPayloadResponses.find((element) => element.dataLabel === 'monthlyFlux');
    const monthlyPngs = await this.stageMonthlyPng( monthlyFluxTiffPayloadResponse );

    monthlyPngs.forEach( (monthlyPng, index)  => {
      const monthIndex = index < 10 ? `0${index}` : `${index}`;
      this.stageMaskedHeatmapPng( `heatmap.monthly${monthIndex}.masked`, monthlyPng, annualFluxTiffPayloadResponse, maskTiffPayloadResponse, rgbTiffPayloadResponse );
    })
    
    return true
  }

  private async stagePng(tiffPayloadResponse: any){
    const tiffKey = tiffPayloadResponse.s3Result.key;
    const tiffBuffer = tiffPayloadResponse.payload;
    const dataLabel = tiffPayloadResponse.dataLabel;

    let newPng = await generatePng( dataLabel, tiffBuffer);
    
    let fileName = dataLabel;
    
    if ( dataLabel === 'annualFlux' ){
      fileName = 'heatmap.annual';
    }
    
    const pngKey = this.setPngKey( tiffKey, fileName );
    const pngFilename = path.join(__dirname, 'png', `${fileName}.png`);

    console.log( `dataLabel: ${dataLabel} || pngKey: ${pngKey}`);

    this.savePngToS3( pngKey, newPng )

    // TODO TEMP: don't write to disk
    writePngToFile( newPng, pngFilename );

    return newPng
  }

  private async stageMonthlyPng(tiffPayloadResponse: any){
    const tiffKey = tiffPayloadResponse.s3Result.key;
    const tiffBuffer = tiffPayloadResponse.payload;
    const dataLabel = tiffPayloadResponse.dataLabel;

    let response = await generateMonthlyPngs(tiffBuffer);
    
    let fileName = 'heatmap.monthly';

    response.map((layerPng, layerPngIndex) => {
      const monthIndex = layerPngIndex < 10 ? `0${layerPngIndex}` : `${layerPngIndex}`;
      const pngKey = this.setPngKey( tiffKey, `${fileName}${monthIndex}` );
      const pngFilename = path.join(__dirname, 'png', `${fileName}${monthIndex}.png`);
  
      console.log( `dataLabel: ${dataLabel} || pngKey: ${pngKey}`);
  
      this.savePngToS3( pngKey, layerPng )
  
      // TODO TEMP: don't write to disk
      writePngToFile( layerPng, pngFilename );
    })
    

    return response
  }

  private async stageMaskedHeatmapPng(filename: string, annualHeatmapPng: PNG, tiffPayloadResponse: any, maskTiffPayloadResponse: any, rgbTiffPayloadResponse: any){
    const tiffKey = tiffPayloadResponse.s3Result.key;

    const maskBuffer = maskTiffPayloadResponse.payload;
    const rgbBuffer = rgbTiffPayloadResponse.payload;

    const annualFluxMaskedPng = await generateMaskedHeatmapPngs( annualHeatmapPng, maskBuffer, rgbBuffer);

    const pngKey = this.setPngKey( tiffKey, filename );
    const pngFilename = path.join(__dirname, 'png', `${filename}.png`);
    console.log( pngFilename );

    this.savePngToS3( pngKey, annualFluxMaskedPng )
    await writePngToFile( annualFluxMaskedPng, pngFilename );
    
    return true;
  }

}
