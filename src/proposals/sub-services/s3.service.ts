import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { Stream, PassThrough } from 'stream';

@Injectable()
export class GetPresignedUrlService {
  private S3: AWS.S3;

  AWS_BUCKET: string;

  AWS_REGION: string;

  constructor() {
    // Configure AWS with your access and secret key.
    const { PROPOSAL_AWS_BUCKET, PROPOSAL_AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

    // Configure AWS to use promise
    AWS.config.setPromisesDependency(global.Promise);

    const creds = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: PROPOSAL_AWS_REGION,
    };
    AWS.config.update(creds);

    this.AWS_BUCKET = PROPOSAL_AWS_BUCKET || 'proposal-data-development';
    this.AWS_REGION = PROPOSAL_AWS_REGION || 'us-west-1';

    this.S3 = new AWS.S3(creds);
  }

  getPreviewLink(fileName: string, fileType: string): Promise<string> {
    const bucketName = this.AWS_BUCKET;
    const params = {
      Bucket: bucketName,
      // Prefix: fileName,
      Key: `${fileName}/${fileName}.${fileType}`,
    
      Expires: 300,
    };

    // this.S3
    return this.S3.getSignedUrlPromise('getObject', params);
  }

  getDownloadLink(fileName: string, fileType: string): Promise<string> {
    const bucketName = this.AWS_BUCKET;
    const params = {
      Bucket: bucketName,
      // Prefix: fileName,
      Key: `${fileName}/${fileName}.${fileType}`,
      Expires: 300,
      ResponseContentDisposition: `attachment; filename="${fileName}.${fileType}"`,
    };


    this.S3.getObject()
    return this.S3.getSignedUrlPromise('getObject', params);
  }

  // TODO move to AWSServices.S3Service
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
