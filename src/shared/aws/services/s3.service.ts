import { Stream, PassThrough } from 'stream';
import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as mime from 'mime';
import { ApplicationException } from 'src/app/app.exception';
import { CredentialService } from './credential.service';
import { IS3GetLocationFromUrlResult, IS3GetUrlOptions, IS3RootDir } from '../interfaces';
import { Readable } from 'node:stream';

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
    const filePath = this.buildObjectKey(fileName, fileNameWithExt, rootDir);

    const fileExisted = await this.hasFile(bucketName, filePath);

    if (!fileExisted) {
      throw ApplicationException.NotFoundStatus('File', filePath);
    }

    const attachment = downloadable ? `attachment; filename="${fileNameWithExt}"` : undefined;

    let contentType = '';

    if (responseContentType) {
      if (typeof responseContentType === 'string') contentType = responseContentType;
      else contentType = extractedExt && (mime as any).getType(extractedExt);
    }

    const params: Record<string, string | number> = {
      Bucket: bucketName,
      Key: filePath,
    };

    if (expires) params.Expires = expires;

    if (contentType) params.ResponseContentType = contentType;

    if (alias) {
      if (attachment) {
        params.ResponseContentDisposition = `attachment; fileName="${alias}"`;
      } else params.ResponseContentDisposition = `inline; fileName="${alias}"`;
    } else {
      if (attachment) params.ResponseContentDisposition = attachment;
    }

    return this.S3.getSignedUrlPromise('getObject', params);
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
   * @param noDirWrapper
   * @param cb
   */
  public putStream(
    fileName: string,
    bucketName: string,
    mime: string,
    acl: string,
    noDirWrapper: boolean,
    cb: (err: Error, data: AWS.S3.ManagedUpload.SendData) => void,
  ): PassThrough;
  public putStream(...args: unknown[]): PassThrough {
    const passthrough = new Stream.PassThrough();

    const [fileName, bucketName, mime, acl] = args as any[];

    const [name] = fileName.split('.');

    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Body: passthrough,
      Key: args.length === 6 && args[5] ? fileName : `${name}/${fileName}`,
      ContentType: mime,
      ACL: acl,
    };

    this.S3.upload(params, args[args.length - 1] as any);
    return passthrough;
  }

  /**
   * Put Base64 image to S3
   * @param bucketName
   * @param str
   * @param acl
   * @returns
   */
  public putBase64Image(bucketName: string, base64Data: string, acl: string, opts: IS3RootDir = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const { rootDir } = opts;
      const buf = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const type = base64Data.split(';')[0].split('/')[1];

      const fileName = `${+new Date()}`;
      const fileNameWithExt = `${fileName}.${type}`;

      const params = {
        Bucket: bucketName,
        Key: this.buildObjectKey(fileName, fileNameWithExt, rootDir),
        Body: buf,
        ACL: acl,
        ContentEncoding: 'base64',
        ContentType: `image/${type}`,
      };
      this.S3.upload(params, undefined, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data?.Location);
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

  private buildObjectKey(fileName: string, fileNameWithExt: string, rootDir?: string | boolean): string {
    if (!rootDir) return decodeURIComponent(fileNameWithExt);

    if (typeof rootDir === 'string') return decodeURIComponent(`${rootDir}/${fileNameWithExt}`);

    const encodedKey = `${fileName}/${fileNameWithExt}`;

    return decodeURIComponent(encodedKey);
  }

  public getObjectAsReadable(bucket: string, fileName: string): Readable {
    return this.S3.getObject({
      Bucket: bucket,
      Key: fileName,
    }).createReadStream();
  }
}
