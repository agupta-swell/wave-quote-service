import { Global, Module } from '@nestjs/common';
import { FlushContextInterceptor } from './interceptor';
import { AsyncContextProvider } from './providers/async-context.provider';

@Global()
@Module({
  providers: [AsyncContextProvider, FlushContextInterceptor],
  exports: [AsyncContextProvider, FlushContextInterceptor],
})
export class AsyncContextModule {}
