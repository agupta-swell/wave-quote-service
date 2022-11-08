import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { TOOL_TIP_COLLECTION } from './constants';
import { ToolTipController } from './tool-tip.controller';
import { ToolTipSchema, TOOL_TIP } from './tool-tip.schema';
import { ToolTipService } from './tool-tip.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: TOOL_TIP,
        schema: ToolTipSchema,
        collection: TOOL_TIP_COLLECTION,
      },
    ]),
  ],
  controllers: [ToolTipController],
  providers: [ToolTipService],
  exports: [ToolTipService],
})
export class ToolTipModule {}
