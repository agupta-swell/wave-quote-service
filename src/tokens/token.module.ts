import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { TOKENS_COLLECTION } from './constants';
import { TokenController } from './token.controller';
import { TokenSchema, TOKEN } from './token.schema';
import { TokenService } from './token.service';

@Module({
    imports: [
      JwtModule.registerAsync({
        useClass: JwtConfigService,
      }),
      MongooseModule.forFeature([
        {
          name: TOKEN,
          schema: TokenSchema,
          collection: TOKENS_COLLECTION,
        },
      ]),
    ],
    controllers: [TokenController],
    providers: [TokenService],
    exports: [TokenService],
  })
  export class TokenModule {}
  