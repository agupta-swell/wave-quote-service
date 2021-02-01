import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { OpportunityController } from './opportunity.controller';
import { OPPORTUNITY, OpportunitySchema } from './opportunity.schema';
import { OpportunityService } from './opportunity.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: OPPORTUNITY,
        schema: OpportunitySchema,
        collection: 'opportunities',
      },
    ]),
  ],
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
