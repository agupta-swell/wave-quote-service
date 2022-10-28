import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ProductionDeratesController } from './production-derates-v2.controller';
import { ProductionDeratesService } from './production-derates-v2.service';
import { ProductionDeratesSchema } from './production-derates-v2.schema';
import { PRODUCTION_DERATES_COLLECTION_NAME } from './constants';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: PRODUCTION_DERATES_COLLECTION_NAME,
        schema: ProductionDeratesSchema,
        collection: PRODUCTION_DERATES_COLLECTION_NAME,
      },
    ]),
  ],
  controllers: [ProductionDeratesController],
  providers: [ProductionDeratesService],
  exports: [ProductionDeratesService],
})
export class ProductionDeratesModule {}
