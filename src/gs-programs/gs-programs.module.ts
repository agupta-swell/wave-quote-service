import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ProductModuleV2 } from 'src/products-v2/product.module';
import { GsProgramsController } from './gs-programs.controller';
import { GsProgramsSchema, GS_PROGRAMS } from './gs-programs.schema';
import { GsProgramsService } from './gs-programs.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: GS_PROGRAMS,
        schema: GsProgramsSchema,
        collection: 'gs_programs',
      },
    ]),
    ProductModuleV2,
  ],
  controllers: [GsProgramsController],
  providers: [GsProgramsService],
  exports: [GsProgramsService],
})
export class GsProgramsModule {}
