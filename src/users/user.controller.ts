import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('/')
export class UserController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'ApiOperation' })
  async getBrands(): Promise<string> {
    return 'demo response';
  }
}
