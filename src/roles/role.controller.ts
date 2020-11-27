import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { RoleDto } from './res/role.dto';
import { RoleService } from './role.service';

@ApiTags('Role')
@ApiBearerAuth()
@Controller('/roles')
@PreAuthenticate()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get(':id')
  async getDetails(@Param('id') id: string): Promise<ServiceResponse<RoleDto>> {
    const result = await this.roleService.getOne(id);
    return ServiceResponse.fromResult(result);
  }
}
