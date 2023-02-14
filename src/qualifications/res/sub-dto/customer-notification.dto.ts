import { ExposeProp } from 'src/shared/decorators';

export class CustomerNotificationDto {
  @ExposeProp()
  sentOn: Date;

  @ExposeProp()
  email: string;
}
