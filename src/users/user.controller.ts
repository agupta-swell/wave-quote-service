import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { UserDto } from './res/user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getDetails(@Param('id') id: string): Promise<ServiceResponse<UserDto>> {
    const res = await this.userService.getOne(id);
    return ServiceResponse.fromResult(res);
  }
}
