import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';

import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { TokenDto } from './res/token.dto';
import { ITokenDocument, TOKEN } from './token.schema';

export class TokenService {
    constructor(
      @InjectModel(TOKEN)
      private tokenModel: Model<ITokenDocument>,
    ) {}
  

      async isTokenValid(note: string, token: string): Promise<OperationResult<{responseStatus: boolean}>> {
      const validToken = await this.tokenModel.findOne({ note: note });

      if(validToken?._id === token){
        return OperationResult.ok({responseStatus: true});
      }else{
        return OperationResult.ok({responseStatus: false});
      }
    }
  }