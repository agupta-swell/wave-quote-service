import { ApiProperty } from '@nestjs/swagger';
import { SystemProductionDto } from 'src/system-designs/res/system-design.dto';
import { UpdateQuoteDto } from './update-quote.dto';

class UtilityProgramDto {
  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  utilityProgramName: string;
}

export class CalculateQuoteDetailDto extends UpdateQuoteDto {
  @ApiProperty()
  quoteId: string;

  @ApiProperty({ type: SystemProductionDto })
  systemProduction: SystemProductionDto;

  @ApiProperty({ type: UtilityProgramDto })
  utilityProgram: UtilityProgramDto;
}
