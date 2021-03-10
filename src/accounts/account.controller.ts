import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { AccountService } from './account.service';
import { AccountDto } from './res/account.dto';

@ApiTags('Account')
@ApiBearerAuth()
@Controller('/accounts')
@PreAuthenticate()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':id/funding-source-access')
  @ApiOperation({ summary: 'Get Funding Source Accessess' })
  async getFundingSourceAccesses(@Param('id') id: string): Promise<ServiceResponse<AccountDto>> {
    const result = await this.accountService.getFundingSourceAccesses(id);
    return ServiceResponse.fromResult(result);
  }
}
