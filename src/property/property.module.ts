import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertyService } from './property.service';
import { PropertiesSchema } from './property.schema';
import { PROPERTY_COLLECTION_NAME } from './constants';
import { PropertyController } from './property.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PROPERTY_COLLECTION_NAME,
        schema: PropertiesSchema,
        collection: PROPERTY_COLLECTION_NAME,
      },
    ]),
  ],
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}
