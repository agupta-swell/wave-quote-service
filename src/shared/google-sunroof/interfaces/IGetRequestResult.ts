// TODO delete this file

import { ManagedUpload } from 'aws-sdk/clients/s3';

export interface IGetRequestResult<T> {
  payload: T;
}

export interface IGetRequestResultWithS3UploadResult<T> extends IGetRequestResult<T> {
  s3Result: ManagedUpload.SendData;
}
