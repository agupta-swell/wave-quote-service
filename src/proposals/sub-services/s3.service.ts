import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class GetPresignedUrlService {
  AWS_BUCKET: string;

  AWS_REGION: string;

  constructor() {
    // Configure AWS with your access and secret key.
    const { AWS_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

    // Configure AWS to use promise
    AWS.config.setPromisesDependency(require('bluebird'));
    AWS.config.update({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: AWS_REGION,
    });

    this.AWS_BUCKET = AWS_BUCKET || 'proposal-data-development';
    this.AWS_REGION = AWS_REGION || 'us-west-1';
  }

  getPreviewLink(fileName: string, fileType: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const s3 = new AWS.S3();
        const bucketName = this.AWS_BUCKET;
        const params = {
          Bucket: bucketName,
          // Prefix: fileName,
          Key: `${fileName}/${fileName}.${fileType}`,
          Expires: 300,
        };
        s3.getSignedUrlPromise('getObject', params).then(
          url => resolve(url),
          err => reject(err),
        );
      } catch (error) {
        return reject(error);
      }
    });
  }

  getDownloadLink(fileName: string, fileType: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const s3 = new AWS.S3();
        const bucketName = this.AWS_BUCKET;
        const params = {
          Bucket: bucketName,
          // Prefix: fileName,
          Key: `${fileName}/${fileName}.${fileType}`,
          Expires: 300,
          ResponseContentDisposition: `attachment; filename="${fileName}.${fileType}"`,
        };
        s3.getSignedUrlPromise('getObject', params).then(
          url => resolve(url),
          err => reject(err),
        );
      } catch (error) {
        return reject(error);
      }
    });
  }
}
