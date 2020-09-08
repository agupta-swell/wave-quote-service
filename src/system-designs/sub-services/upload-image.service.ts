import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class UploadImageService {
  async uploadToAWSS3(imageData: string) {
    // Configure AWS with your access and secret key.
    const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET } = process.env;

    // Configure AWS to use promise
    AWS.config.setPromisesDependency(require('bluebird'));
    AWS.config.update({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY, region: AWS_REGION });

    const s3 = new AWS.S3();
    const base64Data = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // Getting the file type, ie: jpeg, png or gif
    const type = imageData.split(';')[0].split('/')[1];

    // Generally we'd have an userId associated with the image
    // For this example, we'll simulate one
    const userId = 802195124683;

    // With this setup, each time your user uploads an image, will be overwritten.
    // To prevent this, use a different Key each time.
    // This won't be needed if they're uploading their avatar, hence the filename, userAvatar.js.
    const params = {
      Bucket: S3_BUCKET,
      Key: `${userId}.${type}`, // type is not required
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
}
