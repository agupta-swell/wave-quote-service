import { CallHandler, ExecutionContext, NestInterceptor, SetMetadata, Type } from '@nestjs/common';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OperationResult } from 'src/app/common';
import { FastifyResponse } from 'src/shared/fastify';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { GoogleSunroofGatewayAxiosException } from '../exceptions';

const ON_FALLBACK_DTO = Symbol('ON_FALLBACK_DTO_SYMBOL');

export const SetOnFallbackDto = (cls: Type) => SetMetadata(ON_FALLBACK_DTO, cls);

export class OnGoogleSunroofGatewayFailInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        const ctx = context.switchToHttp();

        const response = ctx.getResponse<FastifyResponse>();

        const handler = context.getHandler();

        const dtoCls = Reflect.getMetadata(ON_FALLBACK_DTO, handler) as Type<unknown>;

        if (!dtoCls) {
          return throwError(error);
        }

        const body = this.handleError(error, dtoCls);

        if (!body) {
          return throwError(error);
        }

        response.send(body);
        return EMPTY;
      }),
    );
  }

  private handleError(error: any, cls: Type): OperationResult<Record<PropertyKey, unknown>> | undefined {
    if (!(error instanceof GoogleSunroofGatewayAxiosException)) return undefined;

    const { rawError } = error;

    if (rawError.response?.status !== 404) return undefined;

    return OperationResult.ok(strictPlainToClass(cls, {}));
  }
}
