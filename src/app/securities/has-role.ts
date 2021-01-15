import { Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApplicationException } from 'src/app/app.exception';
import { JwtAuthGuard } from './pre-authentication';

export enum ROLES {
  SUPER_MANAGER = 'super_manager',
  ADMIN = 'admin',
  AGENT = 'agent',
  AGENT_BUILDER = 'agent_builder',
}

@Injectable()
export class RolesGuard extends JwtAuthGuard {
  constructor(private readonly roles: string[]) {
    super();
  }

  handleRequest(err: any, user: any, info: any) {
    const hashRoles = {};
    for (const role of user.roles) {
      hashRoles[role] = true;
    }

    const isAuthorized = this.roles.every(role => hashRoles[role]);

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    if (!isAuthorized) {
      throw ApplicationException.NoPermission();
    }
    return user;
  }
}

export const HasRole = (roles: string[]) => UseGuards(new RolesGuard(roles));
