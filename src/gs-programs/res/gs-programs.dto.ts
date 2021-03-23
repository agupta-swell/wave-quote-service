import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { UtilityProgramMasterDto } from 'src/utility-programs-master/res/utility-program-master.dto';
import { UtilityProgramMaster } from 'src/utility-programs-master/utility-program-master.schema';
import { GsPrograms } from '../gs-programs.schema';

export class GsProgramsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  annualIncentives: number;

  @ApiProperty()
  termYears: string;

  @ApiProperty()
  numberBatteries: string;

  @ApiProperty()
  upfrontIncentives: number;

  @ApiProperty({ type: UtilityProgramMasterDto })
  utilityProgram?: UtilityProgramMasterDto;

  constructor(props: LeanDocument<GsPrograms>, utilityProgram: UtilityProgramMaster) {
    this.id = props._id;
    this.annualIncentives = props.annualIncentives;
    this.termYears = props.termYears;
    this.numberBatteries = props.numberBatteries;
    this.upfrontIncentives = props.upfrontIncentives;
    this.utilityProgram = new UtilityProgramMasterDto(utilityProgram);
  }
}

class GsProgramsPaginationDto implements Pagination<GsProgramsDto> {
  @ApiProperty({
    type: GsProgramsDto,
    isArray: true,
  })
  data: GsProgramsDto[];

  @ApiProperty()
  total: number;
}

export class GsProgramsPaginationRes implements ServiceResponse<GsProgramsPaginationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GsProgramsPaginationDto })
  data: GsProgramsPaginationDto;
}
