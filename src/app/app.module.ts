import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthencationModule } from 'src/authentication/authentication.module';
import { RoleModule } from 'src/roles/role.module';
import { SolarPanelModule } from 'src/solar-panels/solar-panel.module';
import { UserModule } from 'src/users/user.module';
import { QuotingModule } from '../quotings/quoting.module';
import { SystemDesignModule } from '../system-designs/system-design.module';
import { ExternalServiceModule } from './../external-services/external-service.module';
import { ProductModule } from './../products/product.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL),
    SolarPanelModule,
    UserModule,
    RoleModule,
    AuthencationModule,
    QuotingModule,
    SystemDesignModule,
    ProductModule,
    ExternalServiceModule,
  ],
})
export class AppModule {
  constructor() {}
}
