import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthencationModule } from 'src/authentication/authentication.module';
import { RoleModule } from 'src/roles/role.module';
import { UserModule } from 'src/users/user.module';
import { SystemDesignModule } from '../system-designs/system-design.module';
import { UtilityModule } from './../utilities/utility.module';
import { AdderConfigModule } from './../adder-config/adder-config.module';
import { ExternalServiceModule } from './../external-services/external-service.module';
import { ProductModule } from './../products/product.module';
import { MyLoggerModule } from './my-logger/my-logger.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL),
    MyLoggerModule,
    UserModule,
    RoleModule,
    AuthencationModule,
    SystemDesignModule,
    ProductModule,
    ExternalServiceModule,
    UtilityModule,
    AdderConfigModule,
  ],
})
export class AppModule {
  constructor() {}
}
