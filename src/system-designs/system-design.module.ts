import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemDesignController } from './system-design.controller';
import { SystemDesignSchema, SYSTEM_DESIGN } from './system-design.schema';
import { SystemDesignService } from './system-design.service';
import { SystemProductService } from './sub-services/system-product.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: SYSTEM_DESIGN, schema: SystemDesignSchema, collection: 'system_designs' }]),
  ],
  controllers: [SystemDesignController],
  providers: [SystemDesignService, SystemProductService],
  exports: [SystemDesignService],
})
export class SystemDesignModule {}
