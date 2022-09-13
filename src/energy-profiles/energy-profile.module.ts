import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { AwsModule } from 'src/shared/aws/aws.module';
import { SystemDesignModule } from 'src/system-designs/system-design.module';
import { SystemProductionModule } from 'src/system-production/system-production.module';
import { UtilityModule } from 'src/utilities/utility.module';
import { EnergyProfileController } from './energy-profile.controller';
import { EnergyProfileService } from './energy-profile.service';
import { GoogleSunroofModule } from 'src/shared/google-sunroof/google-sunroof.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    SystemDesignModule,
    SystemProductionModule,
    AwsModule,
    GoogleSunroofModule,
  ],
  providers: [EnergyProfileService],
  controllers: [EnergyProfileController],
  exports: [EnergyProfileService],
})
export class EnergyProfileModule {}
