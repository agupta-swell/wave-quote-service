import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilitiesMasterSchema, UTILITIES_MASTER } from './utilities-master.schema';
import { UtilitiesMasterService } from './utilities-master.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UTILITIES_MASTER,
        schema: UtilitiesMasterSchema,
        collection: 'v2_utilities_master',
      },
    ]),
  ],
  providers: [UtilitiesMasterService],
  exports: [UtilitiesMasterService],
})
export class UtilitiesMasterModule {}
