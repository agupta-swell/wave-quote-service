import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { USER, UserSchema } from 'src/users/user.schema';
import { GsProgramsModule } from 'src/gs-programs/gs-programs.module';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { ContractController } from './contract.controller';
import { CONTRACT, ContractSchema } from './contract.schema';
import { ContractService } from './contract.service';
import { InstalledProductModule } from 'src/installed-products/installed-products.module';
import { AwsModule } from 'src/shared/aws/aws.module';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      { name: CONTRACT, schema: ContractSchema, collection: 'v2_contracts' },
      {
        name: USER,
        schema: UserSchema,
        collection: 'users',
      },
    ]),
    AwsModule,
    GsProgramsModule,
    FinancialProductsModule,
    InstalledProductModule,
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
