import { CanActivate, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers.authorization) return false;
    const splitedToken = request.headers.authorization.split(' ');
    try {
      const decoded = await this.jwtService.verifyAsync(splitedToken[1]);
      delete decoded.iat;
      delete decoded.exp;
      request.user = decoded;
    } catch (error) {}
    return true;
  }
}

export const PreAuthenticate = () => UseGuards(JwtAuthGuard);
