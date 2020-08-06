import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SolarPanelModule } from 'src/solar-panels/solar-panel.module';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MongooseModule.forRoot(process.env.MONGO_URL), SolarPanelModule],
})
export class AppModule {
  constructor() {}
}
