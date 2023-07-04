import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { GenabilityUtilityMapModule } from 'src/genability-utility-map/genability-utility-map.module';
import { GsProgramsModule } from 'src/gs-programs/gs-programs.module';
import { InstalledProductModule } from 'src/installed-products/installed-products.module';
import { AwsModule } from 'src/shared/aws/aws.module';
import { DocusignApiModule } from 'src/shared/docusign';
import { SystemAttributeModule } from 'src/system-attributes/system-attribute.module';
import { SystemProductionModule } from 'src/system-productions/system-production.module';
import { USER, UserSchema } from 'src/users/user.schema';
import { ProjectModule } from 'src/projects/project.module';
import { PropertyModule } from 'src/property/property.module';
import { GsOpportunityModule } from 'src/gs-opportunity/gs-opportunity.module';
import { ContractController } from './contract.controller';
import { CONTRACT, ContractSchema } from './contract.schema';
import { ContractService } from './contract.service';

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
    DocusignApiModule.forContext(),
    GenabilityUtilityMapModule,
    SystemAttributeModule,
    SystemProductionModule,
    ProjectModule,
    PropertyModule,
    GsOpportunityModule,
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
