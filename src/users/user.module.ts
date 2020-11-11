import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { USER, UserSchema } from './user.schema';
import { UserService } from './user.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: USER,
        schema: UserSchema,
        collection: 'users',
      },
    ]),
  ],

  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
