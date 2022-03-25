import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, OperatorFunction } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TYPICAL_USAGE_METAKEY } from '../constants';
import { IGetTypicalUsageKwh } from '../sub-services';

@Injectable()
export class PipeTypicalUsageInterceptor<T extends IGetTypicalUsageKwh> implements NestInterceptor<Observable<T>> {
  constructor(private readonly _reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<Observable<T>>): Observable<any> | Promise<Observable<any>> {
    const pipes: OperatorFunction<any, any>[] = this._reflector.getAllAndMerge(TYPICAL_USAGE_METAKEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(mergeMap(res => (of(res).pipe as any)(...(pipes as any))));
  }
}
