import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FniCallbackService } from './sub-services/fni-callback.service';

@ApiTags('Sighten')
@Controller()
export class SightenController {
  constructor(private readonly fniCallbackService: FniCallbackService) {}

  // FIXME: need to delete later
  @Post('/updateSighten')
  @ApiOperation({ summary: 'Update Sighten' })
  async updateSighten(@Body() req: any): Promise<any> {
    const res = await this.fniCallbackService.updateSighten(req);
    return res;
  }
}
