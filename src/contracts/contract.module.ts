import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractController } from './contract.controller';
import { CONTRACT, ContractSchema } from './contract.schema';
import { ContractService } from './contract.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: CONTRACT, schema: ContractSchema, collection: 'v2_contracts' }])],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
