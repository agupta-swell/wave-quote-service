import { ExposeProp } from 'src/shared/decorators';

class PresignedPostDto {
  @ExposeProp()
  url: string;

  @ExposeProp()
  fields: Record<string, string>;
}

export class GetPresignedPostUrlResDto {
  @ExposeProp({ type: PresignedPostDto })
  presignedPostData: PresignedPostDto;

  @ExposeProp()
  key: string;
}
