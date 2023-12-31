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
    if (this.isPublicCtx(context)) {
      return true;
    }

    const resourceSecret = this.getResourceScoped(context);

    if (resourceSecret) {
      return this.validateResource(context, resourceSecret);
    }

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

  private async validateResource(ctx: ExecutionContext, secret: string): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const { query } = request;

    if (!query?.key) {
      return false;
    }

    const { key: token } = query;

    try {
      const { iat: _, exp: __, ...p } = await this.jwtService.verifyAsync(token, {
        secret: `${secret}_${JwtConfigService.appSecret}`,
      });

      request.user = p;
      return true;
    } catch (err) {
      return false;
    }
  }

  private getResourceScoped(ctx: ExecutionContext): string | undefined {
    const secret = this.reflector.getAllAndOverride<string>(KEYS.RESOURCE_SCOPED, [ctx.getClass(), ctx.getHandler()]);

    return secret;
  }

  private isPublicCtx(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(KEYS.PUBLIC, [ctx.getClass(), ctx.getHandler()]);

    return isPublic;
  }
}

export const PreAuthenticate = () => UseGuards(JwtAuthGuard);
