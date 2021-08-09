import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PreAuthenticate } from '../app/securities';
import { AccountService } from './account.service';

@ApiTags('Account')
@ApiBearerAuth()
@Controller('/accounts')
@PreAuthenticate()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
}
