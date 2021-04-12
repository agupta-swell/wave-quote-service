import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProductDto } from 'src/products/res/product.dto';
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

  @ApiProperty({ type: ProductDto })
  battery?: ProductDto;

  constructor(props: LeanDocument<GsPrograms>, utilityProgram: UtilityProgramMaster, battery: any) {
    this.id = props._id;
    this.annualIncentives = props.annualIncentives;
    this.termYears = props.termYears;
    this.numberBatteries = props.numberBatteries;
    this.upfrontIncentives = props.upfrontIncentives;
    this.utilityProgram = new UtilityProgramMasterDto(utilityProgram);
    const filterBattery = battery.find(({ _id }) => _id.equals(props.batteryId));
    this.battery = filterBattery ? new ProductDto(filterBattery) : undefined;
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
