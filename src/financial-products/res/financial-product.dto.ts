import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class FinancialProductDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  fundingSourceId: string;

  @ExposeProp()
  isActive: boolean;

  @ExposeProp()
  name: string;

  @ExposeProp()
  fundId: string;

  @ExposeProp()
  allowDownPayment: boolean;

  @ExposeProp()
  minDownPayment: number;

  @ExposeProp()
  defaultDownPayment: number;

  @ExposeProp()
  maxDownPayment: number;

  @ExposeProp()
  annualDegradation: number;

  @ExposeProp()
  guaranteedProduction: number;

  @ExposeProp()
  minMargin: number;

  @ExposeProp()
  maxMargin: number;

  @ExposeProp()
  minSystemKw: number;

  @ExposeProp()
  maxSystemKw: number;

  @ExposeProp()
  minBatteryKwh: number;

  @ExposeProp()
  maxBatteryKwh: number;

  @ExposeProp()
  minProductivity: number;

  @ExposeProp()
  maxProductivity: number;

  @ExposeProp()
  allowedStates: string[];

  @ExposeProp()
  interestRate: number;

  @ExposeProp()
  termMonths: number;

  @ExposeProp()
  dealerFee: number;

  @ExposeProp()
  financierId?: string;
}

class FinancialProductPaginationDto implements Pagination<FinancialProductDto> {
  @ExposeProp({
    type: FinancialProductDto,
    isArray: true,
  })
  data: FinancialProductDto[];

  @ExposeProp()
  total: number;
}

export class FinancialProductPaginationRes implements ServiceResponse<FinancialProductPaginationDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: FinancialProductPaginationDto })
  data: FinancialProductPaginationDto;
}
