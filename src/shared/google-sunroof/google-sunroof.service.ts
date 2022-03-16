/* eslint-disable no-restricted-syntax */
import * as https from 'https';
import * as qs from 'qs';
import { Injectable } from '@nestjs/common';
import { Stream } from 'stream';
import { S3Service } from '../aws/services/s3.service';
import { generatePng } from './sub-services/file-generator.service';
import { SUNROOF_API } from './constants';
import {
  IGetBuildingResult,
  IGetSolarInfoResult,
  IGetRequestResult,
  IGetRequestResultWithS3UploadResult,
} from './interfaces';

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

  public stagePng( tiffPayloadResponses ){
    // console.log( tiffPayloadResponses );

    tiffPayloadResponses.forEach( response => {
      const tiffKey = response.s3Result.key;
      const tiffBuffer = response.payload;
      const tiffName = tiffKey.slice( 
        tiffKey.lastIndexOf('/') + 1, 
        tiffKey.lastIndexOf('.')
      );
      const pngKey = 
        tiffKey.slice( 0, tiffKey.indexOf('/') ) 
        + '/png/'
        + tiffName
        + '.png';
      
      console.log( `pngKey: ${pngKey}`);

      if (tiffName === 'mask' ){
        console.log( response );
        const maskPng = generatePng( tiffName, tiffBuffer );
        
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

            const pngFile = maskPng;

            try {
              return({
                s3Result: data,
                payload: pngFile
              });
            } catch (error) {
              console.log( err )
              return (error);
            }
          },
        );

      }
    })
  }
}
