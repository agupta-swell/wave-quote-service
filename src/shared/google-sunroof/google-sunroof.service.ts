import * as https from 'https';
import * as qs from 'qs';
import { Injectable } from '@nestjs/common';
import { S3Service } from '../aws/services/s3.service';
import { SUNROOF_API } from './constants';
import { Stream } from 'stream';
import { IGetBuildingResult, IGetRequestResult, IGetRequestResultWithS3UploadResult } from './interfaces';

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

        if (cacheKey) {
          const chunks: Buffer[] = [];

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
                true,
                (err, data) => {
                  if (err) return reject(err);

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

          return;
        }

        const chunks: Buffer[] = [];

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
}