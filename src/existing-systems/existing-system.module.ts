import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ManufacturerModule } from 'src/manufacturers/manufacturer.module';
import { OpportunityModule } from 'src/opportunities/opportunity.module';
import { ProductModuleV2 } from 'src/products-v2/product.module';
import { EXISTING_SYSTEM_COLL } from './constants';
import { ExistingSystemController } from './existing-system.controller';
import { ExistingSystemSchema } from './existing-system.schema';
import { ExistingSystemService } from './existing-system.service';
import { ValidateCreateExistingSystemPipe } from './pipes';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: EXISTING_SYSTEM_COLL,
        schema: ExistingSystemSchema,
        collection: EXISTING_SYSTEM_COLL,
      },
    ]),
    forwardRef(() => OpportunityModule),
    ManufacturerModule,
    ProductModuleV2,
  ],
  controllers: [ExistingSystemController],
  providers: [ExistingSystemService, ValidateCreateExistingSystemPipe],
  exports: [ExistingSystemService],
})
export class ExistingSystemModule {}
