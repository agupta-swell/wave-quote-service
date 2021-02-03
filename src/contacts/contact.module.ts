import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractController } from './contact.controller';
import { CONTACT, ContactSchema } from './contact.schema';
import { ContactService } from './contact.service';

@Global()
@Module({
  imports: [
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
