import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { ApplicationException } from 'src/app/app.exception';
import { UserService } from 'src/users/user.service';
import { AuthenticationDto } from './res/authentication.dto';

const crypto = require('crypto');

@Injectable()
export class AuthenticationService {
  saltRounds = 10;

  constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}

  async login(email: string, password: string): Promise<AuthenticationDto> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw ApplicationException.EmailNotFound();

    // TODO: need to hash sha256 in front-end
    const hashPassword = crypto.createHash('sha256').update(password).digest('hex');

    const match = await compare(hashPassword, (user.services as any).password.bcrypt);
    if (!match) throw new UnauthorizedException();
    const payload = { userName: user.profile.firstName, roles: user.roles, userId: user._id };
    return new AuthenticationDto({ accessToken: this.jwtService.sign(payload, { algorithm: 'HS512' }) });
  }
}
