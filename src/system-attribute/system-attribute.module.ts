import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { SystemAttributeSchema, SYSTEM_ATTRIBUTE_COLL, SYSTEM_ATTRIBUTE_MODEL } from './system-attribute.schema';
import { SystemAttributeService } from './system-attribute.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: SYSTEM_ATTRIBUTE_MODEL,
        schema: SystemAttributeSchema,
        collection: SYSTEM_ATTRIBUTE_COLL,
      },
    ]),
  ],
  providers: [SystemAttributeService],
  exports: [SystemAttributeService],
})
export class SystemAttributeModule {}
