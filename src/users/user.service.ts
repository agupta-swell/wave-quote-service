import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { ApplicationException } from '../app/app.exception';
import { UserDto } from './res/user.dto';
import { USER, User } from './user.schema';

@Injectable()
export class UserService {
  exprieTime = 86400000;
  constructor(@InjectModel(USER) private userModel: Model<User>) {}

  async getOne(id: string): Promise<OperationResult<UserDto>> {
    const res = await this.userModel.findById(id);
    if (!res) {
      throw ApplicationException.EnitityNotFound(id);
    }
    return OperationResult.ok(new UserDto(res));
  }

  async findByEmail(email: string): Promise<User> {
    const res = await this.userModel.find({ 'emails.address': email });
    if (!res.length) return null;
    return res[0];
  }
}
