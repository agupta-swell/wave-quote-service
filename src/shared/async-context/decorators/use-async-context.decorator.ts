import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { UseRouteMapper } from 'src/shared/route-mapper';
import { ASYNC_CTX } from '../constants';
import { FlushContextInterceptor } from '../interceptor';

export const UseAsyncContext =  applyDecorators(UseRouteMapper(ASYNC_CTX), UseInterceptors(FlushContextInterceptor));
