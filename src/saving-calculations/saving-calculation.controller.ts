import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { GetSavingReqDto } from './req/get-saving.dto';
import { GetSavingDto, GetSavingRes } from './res/get-saving.dto';
import { SavingCalculationService } from './saving-calculation.service';

@ApiTags('Saving Calculation')
@Controller('/saving-calculations')
export class SavingCalculationController {
  constructor(private readonly savingCalculationService: SavingCalculationService) {}

  @Post()
  @ApiBearerAuth()
  @PreAuthenticate()
  @ApiOperation({ summary: 'Get Savings' })
  @ApiOkResponse({ type: GetSavingRes })
  async getSavings(@Body() req: GetSavingReqDto): Promise<ServiceResponse<GetSavingDto>> {
    const res = await this.savingCalculationService.getSavings(req);
    return ServiceResponse.fromResult(res);
  }
}
