import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetRoofTopImagePresignedPostUrlQueryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/(^image)(\/)(jpe?g|png)$/)
  fileType: string;
}
