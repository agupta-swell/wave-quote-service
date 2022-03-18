import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { OperatorFunction } from 'rxjs';
import { TYPICAL_USAGE_METAKEY } from '../constants';
import { PipeTypicalUsageInterceptor } from './pipe-typical-usage.interceptor';

export const TransformTypicalUsage = (...pipes: OperatorFunction<unknown, unknown>[]) =>
  applyDecorators(SetMetadata(TYPICAL_USAGE_METAKEY, pipes), UseInterceptors(PipeTypicalUsageInterceptor));
