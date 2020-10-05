import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilityProgramSchema, UTILITY_PROGRAM } from './utility-program.schema';
import { UtilityProgramService } from './utility-program.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UTILITY_PROGRAM,
        schema: UtilityProgramSchema,
        collection: 'utility_program',
      },
    ]),
  ],
  providers: [UtilityProgramService],
  exports: [UtilityProgramService],
})
export class UtilityProgramModule {}
