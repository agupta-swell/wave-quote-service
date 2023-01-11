import { ExposeProp } from 'src/shared/decorators';

export class CsvExportResDto {
  @ExposeProp()
  csv: string;
}
