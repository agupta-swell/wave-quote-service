/* eslint-disable @typescript-eslint/ban-types */
import { Inject } from '@nestjs/common';
import { createBucketInjectKey } from '../utils';

export function InjectBucket(bucketName: string): ParameterDecorator;
export function InjectBucket(bucketName: string, connectionName: string): ParameterDecorator;
export function InjectBucket(bucketName: string, connectionName?: string): ParameterDecorator {
  return Inject(createBucketInjectKey(bucketName, connectionName));
}
