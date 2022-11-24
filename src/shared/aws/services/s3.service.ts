import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as mime from 'mime';
import { ApplicationException } from 'src/app/app.exception';
import { PassThrough, Readable, Stream } from 'stream';
import { IS3GetLocationFromUrlResult, IS3GetUrlOptions, IS3RootDir } from '../interfaces';
import { CredentialService } from './credential.service';

@Injectable()
export class S3Service {
  private S3: AWS.S3;

  constructor(private readonly credentialService: CredentialService) {
    this.S3 = new AWS.S3(this.credentialService.getCredentials());
  }

  public async getUrl(bucketName: string, fileName: string, opts: IS3GetUrlOptions = {}): Promise<string> {
    const { downloadable, expires, extName, responseContentType, rootDir, alias } = opts;
    const fileNameWithExt = extName ? `${fileName}.${extName}` : fileName;

    let extractedExt = extName;
    if (!extName) {
      const parts = fileName.split('.');

      if (parts.length > 1) extractedExt = parts[fileName.length - 1];
    }

    const filePath = this.buildObjectKey(fileNameWithExt, rootDir);

    const objectKey = this.decodeObjectKey(filePath);

    const fileExisted = await this.hasFile(bucketName, objectKey);

    if (!fileExisted) {
      throw ApplicationException.NotFoundStatus('File', objectKey);
    }

    const attachment = downloadable ? `attachment; filename="${fileNameWithExt}"` : undefined;

    let contentType = '';

    if (responseContentType) {
      if (typeof responseContentType === 'string') contentType = responseContentType;
      else contentType = extractedExt && (mime as any).getType(extractedExt);
    }

    const params: Record<string, string | number> = {
      Bucket: bucketName,
      Key: objectKey,
    };

    if (expires) params.Expires = expires;

    if (contentType) params.ResponseContentType = contentType;

    if (alias) {
      if (attachment) {
        params.ResponseContentDisposition = `attachment; fileName="${alias}"`;
      } else params.ResponseContentDisposition = `inline; fileName="${alias}"`;
    } else if (attachment) params.ResponseContentDisposition = attachment;

    return this.S3.getSignedUrlPromise('getObject', params);
  }

  public getObject(bucketName: string, Key: string): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      this.S3.getObject({ Bucket: bucketName, Key }, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data?.Body?.toString());
      });
    });
  }

  public putObject(bucketName: string, key: string, data: string | Buffer | Blob, contentType: string) {
    return new Promise((resolve, reject) => {
      this.S3.putObject(
        {
          Bucket: bucketName,
          Key: key,
          Body: data,
          ContentType: contentType,
        },
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        },
      );
    });
  }

  /**
   * Upload a readableStream to S3 Bucket
   * @param fileName
   * @param bucketName
   * @param mime
   * @param acl
   * @param cb
   */
  public putStream(
    fileName: string,
    bucketName: string,
    mime: string,
    acl: string,
    cb: (err: Error, data: AWS.S3.ManagedUpload.SendData) => void,
  ): PassThrough;

  /**
   * Use absolute fileName for object key
   * @param fileName
   * @param bucketName
   * @param mime
   * @param acl
   * @param dir
   * @param cb
   */
  public putStream(
    fileName: string,
    bucketName: string,
    mime: string,
    acl: string,
    dir: boolean | string,
    cb: (err: Error, data: AWS.S3.ManagedUpload.SendData) => void,
  ): PassThrough;

  public putStream(...args: unknown[]): PassThrough {
    const passthrough = new Stream.PassThrough();

    const [fileName, bucketName, mime, acl] = args as any[];

    const dir = args.length === 6 ? <boolean | string>args[4] : undefined;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Body: passthrough,
      Key: this.buildObjectKey(fileName, dir),
      ContentType: mime,
      ACL: acl,
    };

    this.S3.upload(params, args[args.length - 1] as any);
    return passthrough;
  }

  public async putStreamPromise(
    source: NodeJS.ReadableStream,
    fileName: string,
    bucketName: string,
    mime: string,
    acl: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    return new Promise((resolve, reject) => {
      source.pipe(
        this.putStream(fileName, bucketName, mime, acl, false, (err, res) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(res);
        }),
      );
    });
  }

  /**
   * Put Base64 image to S3
   * @param bucketName
   * @param base64Data
   * @param acl
   * @param opts
   * @returns
   */
  public putBase64Image(
    bucketName: string,
    base64Data: string,
    acl: string,
    opts: IS3RootDir = {},
  ): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      if (!base64Data) {
        resolve(undefined);
        return;
      }

      const { rootDir } = opts;
      const buf = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const type = base64Data.split(';')[0].split('/')[1];

      const fileName = `${+new Date()}`;
      const fileNameWithExt = `${fileName}.${type}`;

      const params = {
        Bucket: bucketName,
        Key: this.buildObjectKey(fileNameWithExt, rootDir),
        Body: buf,
        ACL: acl,
        ContentEncoding: 'base64',
        ContentType: `image/${type}`,
      };
      this.S3.upload(params, undefined, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data?.Location);
      });
    });
  }

  public copySource(
    sourceBucket: string,
    sourceKey: string,
    targetBucket: string,
    targetKey: string,
    acl: string,
  ): Promise<AWS.S3.CopyObjectOutput> {
    return new Promise((resolve, reject) => {
      this.S3.copyObject(
        {
          Bucket: targetBucket,
          CopySource: `${sourceBucket}/${sourceKey}`,
          Key: targetKey || sourceKey,
          ACL: acl,
        },
        (err, data) => {
          if (err) {
            return reject(err);
          }

          return resolve(data);
        },
      );
    });
  }

  public buildUrlFromKey(bucketName: string, keyName: string): string {
    return `https://${bucketName.toLowerCase()}.s3.${this.credentialService
      .getCredentials()
      .region.toLowerCase()}.amazonaws.com/${keyName}`;
  }

  public getLocationFromUrl(url: string): IS3GetLocationFromUrlResult {
    try {
      const parsedUrl = new URL(url);

      const keyName = parsedUrl.pathname.substring(1);
      const bucketName = parsedUrl.host.split('.')[0];

      return {
        keyName,
        bucketName,
      };
    } catch (err) {
      return {
        keyName: '',
        bucketName: '',
      };
    }
  }

  public deleteObject(bucketName: string, key: string): Promise<void> {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      if ([bucketName, key].some(e => !e)) {
        return resolve();
      }

      this.S3.deleteObject(
        {
          Bucket: bucketName,
          Key: key,
        },
        (err, _) => {
          if (err) return reject(err);
          return resolve();
        },
      );
    });
  }

  public hasFile(bucket: string, filePath: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      this.S3.headObject(
        {
          Bucket: bucket,
          Key: filePath,
        },
        (err, _) => {
          if (err) {
            return resolve(false);
          }

          return resolve(true);
        },
      );
    });
  }

  /**
   * Get presigned url for given file and bucket
   *
   * Return empty string if `error` occurs
   * @param bucket
   * @param key
   * @param expires
   * @param logError
   */
  public getSignedUrl(bucket: string, key: string, expires: number, logError?: boolean): Promise<string> {
    return new Promise((resolve, _) =>
      this.S3.getSignedUrl(
        'getObject',
        {
          Bucket: bucket,
          Key: key,
          Expires: expires,
        },
        (err, url) => {
          if (err) {
            resolve('');

            if (logError) console.error(err);

            return;
          }

          resolve(url);
        },
      ),
    );
  }

  private buildObjectKey(fileNameWithExt: string, rootDir?: string | boolean): string {
    if (!rootDir) return fileNameWithExt;

    if (typeof rootDir === 'string') {
      return `${rootDir}/${fileNameWithExt}`;
    }

    return `${fileNameWithExt.split('.')[0]}/${fileNameWithExt}`;
  }

  public getObjectAsReadable(bucket: string, fileName: string): Readable {
    return this.S3.getObject({
      Bucket: bucket,
      Key: fileName,
    }).createReadStream();
  }

  private decodeObjectKey(key: string): string {
    return decodeURIComponent(key.replace(/\+/g, ' '));
  }
}
