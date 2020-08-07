import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserReq {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
