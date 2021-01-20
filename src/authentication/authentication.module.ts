import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { JwtConfigService } from './jwt-config.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthencationModule {}
