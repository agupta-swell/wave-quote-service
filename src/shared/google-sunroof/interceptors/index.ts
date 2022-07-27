import { applyDecorators, Type, UseInterceptors } from '@nestjs/common';
import {
  SetOnFallbackDto,
  OnGoogleSunroofGatewayFailInterceptor,
} from './on-google-sunroof-gateway-fail.interceptor';

export const OnSunroofGatewayFail = (dto: Type) =>
  applyDecorators(SetOnFallbackDto(dto), UseInterceptors(OnGoogleSunroofGatewayFailInterceptor));
