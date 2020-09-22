import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class UploadImageService {
  S3_BUCKET: string;
  AWS_REGION: string;
  constructor() {
    // Configure AWS with your access and secret key.
    const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET } = process.env;

    // Configure AWS to use promise
    AWS.config.setPromisesDependency(require('bluebird'));
    AWS.config.update({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY, region: AWS_REGION });

    this.S3_BUCKET = S3_BUCKET;
    this.AWS_REGION = AWS_REGION;
  }

  async uploadToAWSS3(imageData: string) {
    const s3 = new AWS.S3();
    const base64Data = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const type = imageData.split(';')[0].split('/')[1];

    const params = {
      Bucket: this.S3_BUCKET,
      Key: `${new Date().getTime()}.${type}`, // type is not required
      Body: base64Data,
      ACL: 'public-read',
      ContentEncoding: 'base64', // required
      ContentType: `image/${type}`, // required. Notice the back ticks
    };

    let location = '';
    let key = '';
    try {
      const { Location, Key } = await s3.upload(params).promise();
      location = Location;
      key = Key;
    } catch (error) {
      console.log('uploadToAWSS3', error);
    }

    // Save the Location (url) to your database and Key if needs be.
    // As good developers, we should return the url and let other function do the saving to database etc
    console.log(location, key);

    return location;
  }

  async deleteFileS3(url: string) {
    // Create an s3 instance
    const s3 = new AWS.S3();

    // On around Line 41, you'll see how we stored the "Key"
    // see: https://gist.github.com/SylarRuby/b60eea29c1682519e422476cc5357b60
    const splitOn = `https://${this.S3_BUCKET.toLowerCase()}.s3.${this.AWS_REGION.toLowerCase()}.amazonaws.com/`;
    const Key = url.split(splitOn)[1]; // The `${userId}.${type}`

    const params = {
      Bucket: this.S3_BUCKET,
      Key, // required
    };

    // More on the deleteObject property:
    // see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
    const data = await s3.deleteObject(params).promise();
    console.log(data); // => {} Empty object when successful
  }
}
