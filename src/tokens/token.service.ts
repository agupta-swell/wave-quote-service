import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { TokenDto } from './res/token.dto';
import { ITokenDocument, TOKEN } from './token.schema';

export class TokenService {
    constructor(
      @InjectModel(TOKEN)
      private tokenModel: Model<ITokenDocument>,
    ) {}
  
    async isTokenValid(token): Promise<OperationResult<{responseStatus: boolean}>> {
      const validToken = !!this.tokenModel.findOne({ _id: token });

      if(validToken){
        return OperationResult.ok({responseStatus: true});
      }else{
        return OperationResult.ok({responseStatus: false});
      }
    }
  }