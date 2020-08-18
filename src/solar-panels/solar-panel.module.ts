import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolarPanelController } from './solar-panel.controller';
import { SolarPanelSchema, SOLAR_PANEL } from './solar-panel.schema';
import { SolarPanelService } from './solar-panel.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: SOLAR_PANEL, schema: SolarPanelSchema, collection: 'solar_panels' }])],
  controllers: [SolarPanelController],
  providers: [SolarPanelService],
  exports: [SolarPanelService],
})
export class SolarPanelModule {}
