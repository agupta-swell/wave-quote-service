import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { ApplicationException } from '../app/app.exception';
import { RoleDto } from './res/role.dto';
import { Role } from './role.schema';

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private RoleModel: Model<Role>) {}

  async getOne(id: string): Promise<OperationResult<RoleDto>> {
    const res = await this.RoleModel.findById(id);
    if (!res) {
      throw ApplicationException.EnitityNotFound(id);
    }
    return OperationResult.ok(new RoleDto(res));
  }
}
