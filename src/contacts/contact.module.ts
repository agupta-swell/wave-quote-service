import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { PropertyModule } from 'src/property/property.module';
import { ContactController } from './contact.controller';
import { CONTACT, ContactSchema } from './contact.schema';
import { ContactService } from './contact.service';
import { COUNTER, CounterSchema } from './sub-schemas/counter.schema';

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
      {
        name: COUNTER,
        schema: CounterSchema,
        collection: 'counters',
      },
    ]),
    PropertyModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
