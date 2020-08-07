import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { RoleDto } from './res/role.dto';
import { RoleService } from './role.service';

@ApiTags('Role')
@Controller('/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get(':id')
  async getDetails(@Param('id') id: string): Promise<ServiceResponse<RoleDto>> {
    const result = await this.roleService.getOne(id);
    return ServiceResponse.fromResult(result);
  }
}
