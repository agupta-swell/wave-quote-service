import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OperationResult, ServiceResponse } from 'src/app/common';
import { HealthCheckRes } from './res/healthcheck.dto';

@ApiTags('Health Check')
@Controller('/healthcheck')
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthCheckRes })
  check() {
    return ServiceResponse.fromResult(OperationResult.ok());
  }
}