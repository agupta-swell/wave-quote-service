import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { MountTypesService } from './mount-types-v2.service';
import { MountTypesDto } from './res/mount-types-v2.dto';

@ApiTags('Mount Types')
@Controller('/mount-types')
export class MountTypesController {
  constructor(private readonly mountTypesService: MountTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all mount types' })
  @ApiOkResponse({ type: MountTypesDto })
  async getAllMountTypes(): Promise<ServiceResponse<MountTypesDto[]>> {
    const result = await this.mountTypesService.getAllMountTypes();
    return ServiceResponse.fromResult(result);
  }
}
