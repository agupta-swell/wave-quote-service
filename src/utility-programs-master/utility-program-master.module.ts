import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { UtilityProgramMasterController } from './utility-program-master.controller';
import { UtilityProgramMasterSchema, UTILITY_PROGRAM_MASTER } from './utility-program-master.schema';
import { UtilityProgramMasterService } from './utility-program-master.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: UTILITY_PROGRAM_MASTER,
        schema: UtilityProgramMasterSchema,
        collection: 'v2_utility_programs_master',
      },
    ]),
  ],
  controllers: [UtilityProgramMasterController],
  providers: [UtilityProgramMasterService],
  exports: [UtilityProgramMasterService],
})
export class UtilityProgramMasterModule {}
