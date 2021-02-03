import { Body, Controller, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ContactService } from './contact.service';
import { UpdateGeoLocation } from './req/update-leo-location.req';

@ApiTags('Contact')
@ApiBearerAuth()
@Controller('/contacts')
@PreAuthenticate()
export class ContractController {
  constructor(private readonly contactService: ContactService) {}

  @Put('/geo-location')
  @ApiOperation({ summary: 'Update Geo Location' })
  async saveChangeOrder(@Body() req: UpdateGeoLocation): Promise<ServiceResponse<string>> {
    const res = await this.contactService.saveGeolocation(req);
    return ServiceResponse.fromResult(res);
  }
}
