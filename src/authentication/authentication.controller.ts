import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserType, HasRole, PreAuthenticate } from 'src/app/securities';
import { ROLES } from 'src/roles/constants';
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
  @PreAuthenticate()
  @HasRole([ROLES.ADMIN, ROLES.SUPER_MANAGER])
  getCurrentUser(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}
