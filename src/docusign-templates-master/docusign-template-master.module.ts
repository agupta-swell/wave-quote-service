import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { FinancierModule } from 'src/financiers/financier.module';
import { FinancialProductsModule } from 'src/financial-products/financial-product.module';
import { DocusignTemplateMasterController } from './docusign-template-master.controller';
import { DocusignTemplateMasterSchema, DOCUSIGN_TEMPLATE_MASTER } from './docusign-template-master.schema';
import { DocusignTemplateMasterService } from './docusign-template-master.service';
import {
  DocusignCompositeTemplateMasterSchema,
  DOCUSIGN_COMPOSITE_TEMPLATE_MASTER,
  SignerRoleMasterSchema,
  SIGNER_ROLE_MASTER,
  UtilityMasterSchema,
  UTILITY_MASTER,
} from './schemas';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: DOCUSIGN_TEMPLATE_MASTER,
        schema: DocusignTemplateMasterSchema,
        collection: 'v2_docusign_templates_master',
      },
      {
        name: DOCUSIGN_COMPOSITE_TEMPLATE_MASTER,
        schema: DocusignCompositeTemplateMasterSchema,
        collection: 'v2_docusign_composite_templates_master',
      },
      {
        name: UTILITY_MASTER,
        schema: UtilityMasterSchema,
        collection: 'v2_utilities_master',
      },
      {
        name: SIGNER_ROLE_MASTER,
        schema: SignerRoleMasterSchema,
        collection: 'v2_signer_roles_master',
      },
    ]),
    FinancierModule,
    FinancialProductsModule,
  ],
  controllers: [DocusignTemplateMasterController],
  providers: [DocusignTemplateMasterService],
  exports: [DocusignTemplateMasterService],
})
export class DocusignTemplateMasterModule {}
