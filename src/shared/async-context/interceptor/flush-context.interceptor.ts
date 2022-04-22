import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyResponse } from 'src/shared/fastify';
import { AsyncContextProvider } from '../providers/async-context.provider';

@Injectable()
export class FlushContextInterceptor implements NestInterceptor {
  constructor(private readonly asyncContext: AsyncContextProvider) {}

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const res = ctx.switchToHttp().getResponse<FastifyResponse>();

    return next.handle().pipe(
      map(body => {
        res.send(body);
        this.asyncContext.flush();
      }),
    );
  }
}
