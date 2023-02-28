import { IsOptional } from 'class-validator';
import { ExposeProp } from 'src/shared/decorators';

export class EventDto {
  @ExposeProp()
  issueDate: Date;

  @ExposeProp()
  by: string;

  @ExposeProp()
  detail: string;

  @ExposeProp()
  @IsOptional()
  userId?: string;
}
