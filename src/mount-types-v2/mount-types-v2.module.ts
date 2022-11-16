import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { MountTypesController } from './mount-types-v2.controller';
import { MountTypesSchema, MOUNT_TYPE } from './mount-types-v2.schema';
import { MountTypesService } from './mount-types-v2.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: MOUNT_TYPE,
        schema: MountTypesSchema,
        collection: 'v2_mount_types',
      },
    ]),
  ],
  controllers: [MountTypesController],
  providers: [MountTypesService],
  exports: [MountTypesService],
})
export class MountTypesModule {}
