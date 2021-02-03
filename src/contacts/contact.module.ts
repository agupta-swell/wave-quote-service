import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ContractController } from './contact.controller';
import { CONTACT, ContactSchema } from './contact.schema';
import { ContactService } from './contact.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: CONTACT,
        schema: ContactSchema,
        collection: 'contacts',
      },
    ]),
  ],
  controllers: [ContractController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
