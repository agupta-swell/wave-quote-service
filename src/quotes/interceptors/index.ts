import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { QUOTE_ID_PATH, REQ_TYPE, SaveQuoteIdToReqInterceptor } from './save-quote-id-to-query.interceptor';

export const UseSaveQuoteIdToReq = (quoteIdPath: string, target: 'body' | 'query') =>
  applyDecorators(
    SetMetadata(QUOTE_ID_PATH, quoteIdPath),
    SetMetadata(REQ_TYPE, target),
    UseInterceptors(SaveQuoteIdToReqInterceptor),
  );
