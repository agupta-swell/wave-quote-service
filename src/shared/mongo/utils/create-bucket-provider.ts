import { Provider } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection, mongo, Types } from 'mongoose';
import type { GridFSBucket, GridFSBucketOpenUploadStreamOptions } from 'mongodb';

export type GridFSPromiseBucket = GridFSBucket & {
  deletePromise(_id: Types.ObjectId): Promise<void>;
  uploadPromise(
    filename: string,
    stream: NodeJS.ReadableStream,
    options?: GridFSBucketOpenUploadStreamOptions,
  ): Promise<void>;
};

export const createBucketProvider = (
  key: string,
  bucketName: string,
  connectionName?: string,
): Provider<GridFSPromiseBucket> => ({
  provide: key,
  useFactory: (connection: Connection): GridFSPromiseBucket => {
    const bucket = new mongo.GridFSBucket(connection.db, { bucketName });

    function deletePromise(id: Types.ObjectId): Promise<void> {
      return new Promise((resolve, reject) => {
        bucket.delete(id, err => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    }

    function uploadPromise(
      filename: string,
      stream: NodeJS.ReadableStream,
      options?: GridFSBucketOpenUploadStreamOptions,
    ): Promise<void> {
      return new Promise((resolve, reject) =>
        stream.pipe(bucket.openUploadStream(filename, options)).on('finish', resolve).on('error', reject),
      );
    }

    Object.defineProperty(bucket, 'deletePromise', {
      value: deletePromise.bind(bucket),
    });

    Object.defineProperty(bucket, 'uploadPromise', {
      value: uploadPromise.bind(bucket),
    });

    return (bucket as unknown) as GridFSPromiseBucket;
  },
  inject: [getConnectionToken(connectionName)],
});
