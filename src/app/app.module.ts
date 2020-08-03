import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/users/user.module';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UserModule],
})
export class AppModule {
  constructor() {
    console.log('>>>>>>>>>>>>>>>>', process.env);
  }
}
