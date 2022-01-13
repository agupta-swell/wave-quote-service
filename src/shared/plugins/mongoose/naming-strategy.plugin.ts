import { DynamicModule, Global, Module } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { MongooseNamingStrategy, IMongooseNamingStrategyOptions } from 'src/shared/mongoose-schema-mapper';
import { KEYS } from './constants';
import { MongooseNamingStrategyOpts } from './decorators';

@Global()
@Module({})
export class MongooseNamingStrategyLoader {
  constructor(@MongooseNamingStrategyOpts() opts: IMongooseNamingStrategyOptions | MongooseNamingStrategy) {
    if (opts instanceof MongooseNamingStrategy) {
      mongoose.plugin(opts.getPlugin());
    } else mongoose.plugin(new MongooseNamingStrategy(opts).getPlugin());
  }

  static forRoot(opts: IMongooseNamingStrategyOptions | MongooseNamingStrategy): DynamicModule {
    return {
      module: MongooseNamingStrategyLoader,
      providers: [
        {
          provide: KEYS.NAMING_OPTIONS,
          useValue: opts,
        },
      ],
    };
  }
}
