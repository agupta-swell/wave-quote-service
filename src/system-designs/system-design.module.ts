import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemDesignController } from './system-design.controller';
import { SystemDesignSchema, SYSTEM_DESIGN } from './system-design.schema';
import { SystemDesignService } from './system-design.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: SYSTEM_DESIGN, schema: SystemDesignSchema, collection: 'system_designs' }]),
  ],
  controllers: [SystemDesignController],
  providers: [SystemDesignService],
  exports: [SystemDesignService],
})
export class SystemDesignModule {}
