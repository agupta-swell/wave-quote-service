import { Stream, PassThrough } from 'stream';
import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as mime from 'mime';
import { CredentialService } from './credential.service';
import { IS3GetUrlOptions } from '../interfaces';
@Injectable()
export class S3Service {
  private S3: AWS.S3;

  constructor(private readonly credentialService: CredentialService) {
    this.S3 = new AWS.S3(this.credentialService.getCredentials());
  }

  getUrl(bucketName: string, fileName: string, opts: IS3GetUrlOptions = {}) {
    const { downloadable, expires, extName, responseContentType, rootDir } = opts;
    const fileNameWithExt = extName ? `${fileName}.${extName}` : fileName;

    let extractedExt = extName;
    if (!extName) {
      const parts = fileName.split('.');

      if (parts.length > 1) extractedExt = parts[fileName.length - 1];
    }
    const filePath =
      // eslint-disable-next-line no-nested-ternary
      typeof rootDir === 'string'
        ? `${rootDir}/${fileNameWithExt}`
        : rootDir
        ? `${fileName}/${fileNameWithExt}`
        : fileNameWithExt;

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

    if (attachment) params.ResponseContentDisposition = attachment;

    if (contentType) params.ResponseContentType = contentType;

    // this.S3
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
  putStream(
    fileName: string,
    bucketName: string,
    mime: string,
    acl: string,
    cb: (err: Error, data: AWS.S3.ManagedUpload.SendData) => void,
  ): PassThrough {
    const passthrough = new Stream.PassThrough();

    const [name] = fileName.split('.');

    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Body: passthrough,
      Key: `${name}/${fileName}`,
      ContentType: mime,
      ACL: acl,
    };

    this.S3.upload(params, cb);
    return passthrough;
  }
}
