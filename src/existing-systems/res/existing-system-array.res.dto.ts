import { ExposeProp } from 'src/shared/decorators';

export class ExistingSystemArrayResDto {
  @ExposeProp()
  existingPVAzimuth: number;

  @ExposeProp()
  existingPVPitch: number;

  @ExposeProp()
  existingPVSize: number;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  updatedAt: Date;
}
