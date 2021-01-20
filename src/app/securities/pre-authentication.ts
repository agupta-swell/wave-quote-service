import { CanActivate, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { CUSTOM_JWT_SECRET_KEY } from './custom-jwt-secret-key.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  jwtConfigService: JwtConfigService;
  constructor(private jwtService: JwtService, private readonly reflector: Reflector) {
    this.jwtConfigService = new JwtConfigService();
  }

  async canActivate(context: ExecutionContext) {
    const key = this.reflector.get<string>(CUSTOM_JWT_SECRET_KEY, context.getHandler());
    let secretKey = await this.jwtConfigService.getJWTSecretKey();
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
    return true;
  }
}

export const PreAuthenticate = () => UseGuards(JwtAuthGuard);
