import { DynamicModule, Module, Provider } from '@nestjs/common';
import { createBucketInjectKey, createBucketProvider, GridFSPromiseBucket } from './utils';

@Module({})
export class MongoBucketModule {
  private static cache: Map<string, Provider<GridFSPromiseBucket>> = new Map();

  public static forFeature(bucketName: string, connectionName?: string): DynamicModule {
    const key = createBucketInjectKey(bucketName, connectionName);

    const provider = this.cache.get(key) ?? createBucketProvider(key, bucketName, connectionName);

    return {
      module: MongoBucketModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
