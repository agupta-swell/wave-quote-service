import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserType, PreAuthenticate } from 'src/app/securities';
import { AuthenticationService } from './authentication.service';
import { LoginDto } from './req';
import { AuthenticationDto } from './res/authentication.dto';

@Controller('/auth')
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('login')
  async login(@Body() req: LoginDto): Promise<AuthenticationDto> {
    return await this.authenticationService.login(req.email, req.password);
  }

  @Get()
  @ApiBearerAuth()
  @PreAuthenticate()
  getCurrentUser(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}
