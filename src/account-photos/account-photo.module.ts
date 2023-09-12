import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from 'src/accounts/account.module';
import { JwtConfigService } from 'src/authentication/jwt-config.service';

import { AccountPhotoSchema, ACCOUNT_PHOTOS_COLL } from './account-photo.schema';
import { AccountPhotoService } from './account-photo.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: ACCOUNT_PHOTOS_COLL,
        schema: AccountPhotoSchema,
        collection: 'account_photos',
      },
    ]),
    AccountModule,
  ],
  providers: [AccountPhotoService],
  exports: [AccountPhotoService],
})
export class AccountPhotoModule {}
