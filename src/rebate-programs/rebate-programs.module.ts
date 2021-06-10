import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { RebateProgramController } from './rebate-programs.controller';
import { RebateProgramSchema, REBATE_PROGRAM } from './rebate-programs.schema';
import { RebateProgramService } from './rebate-programs.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: REBATE_PROGRAM,
        schema: RebateProgramSchema,
        collection: 'rebate_programs',
      },
    ]),
  ],
  controllers: [RebateProgramController],
  providers: [RebateProgramService],
  exports: [RebateProgramService],
})
export class RebateProgramModule {}
