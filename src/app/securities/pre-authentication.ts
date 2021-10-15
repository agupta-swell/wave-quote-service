import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { KEYS } from './constants';
import { CUSTOM_JWT_SECRET_KEY } from './custom-jwt-secret-key.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly _systemAllowedRoles: string[] = ['admin', 'it_admin', 'wqt_admin'];

  constructor(private jwtService: JwtService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const key = this.reflector.get<string>(CUSTOM_JWT_SECRET_KEY, context.getHandler());

    let secretKey = '';

    if (!secretKey && !key) {
      secretKey = JwtConfigService.appSecret;
    }

    if (key) {
      secretKey = key;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!request.headers.authorization) return false;

    const splitedToken = request.headers.authorization.split(' ');

    try {
      const decoded = await this.jwtService.verifyAsync(splitedToken[1], {
        secret: secretKey,
        ignoreExpiration: false,
      });

      delete decoded.iat;
      delete decoded.exp;

      request.user = decoded;
    } catch (error) {
      return false;
    }

    const userRoles: string[] | undefined = (<any>request).user?.userRoles;

    const handler = context.getHandler();
    const cls = context.getClass();

    const allowedRoles = this.reflector.getAllAndOverride<string[]>(KEYS.ROLES, [handler, cls]);

    if (!allowedRoles || !allowedRoles.length) return true;

    if (userRoles && userRoles.some(e => this.validateRole(e, allowedRoles))) return true;

    throw new ForbiddenException('You are not allowed to execute this function');
  }

  private validateRole(targetRoles: string, allowedRoles: string[]): boolean {
    return this.isSystemRole(targetRoles) || allowedRoles.includes(targetRoles);
  }

  private isSystemRole(role: string): boolean {
    return this._systemAllowedRoles.includes(role);
  }
}

export const PreAuthenticate = () => UseGuards(JwtAuthGuard);
