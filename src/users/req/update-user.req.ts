import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserReq {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
