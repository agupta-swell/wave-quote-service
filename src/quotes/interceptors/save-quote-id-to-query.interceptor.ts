import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

export const QUOTE_ID_PATH = Symbol('kQuote/params/quoteId');
export const REQ_TYPE = Symbol('kQuote/req/type');

@Injectable()
export class SaveQuoteIdToReqInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();

    const quoteIdPath: string = Reflect.getMetadata(QUOTE_ID_PATH, handler);
    const reqType: string = Reflect.getMetadata(REQ_TYPE, handler);

    const req = context.switchToHttp().getRequest();

    const quoteId = req.params[quoteIdPath];

    const target = req[reqType];

    if (target) {
      req[reqType] = { ...target, quoteId };
    }

    return next.handle();
  }
}
