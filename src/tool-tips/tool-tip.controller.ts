import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ToolTipDto } from './res/tool-tip.dto';
import { ToolTipService } from './tool-tip.service';

@ApiTags('Tool tips')
@Controller('/tool-tips')
export class ToolTipController {
  constructor(private readonly toolTipService: ToolTipService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tool tips' })
  @ApiOkResponse({ type: ToolTipDto })
  async getAllToolTips(): Promise<ServiceResponse<ToolTipDto[]>> {
    const result = await this.toolTipService.getAllToolTips();
    return ServiceResponse.fromResult(result);
  }
}
