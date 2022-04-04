import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { UtilityModule } from 'src/utilities/utility.module';
import { EnergyProfileController } from './energy-profile.controller';
import { EnergyProfileService } from './energy-profile.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    SystemDesignModule,
    UtilityModule,
  ],
  providers: [EnergyProfileService],
  controllers: [EnergyProfileController],
})
export class EnergyProfileModule {}
