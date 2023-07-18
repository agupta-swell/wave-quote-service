import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { ITokenDocument, TOKEN } from './token.schema';

export class TokenService {
  constructor(
    @InjectModel(TOKEN)
    private tokenModel: Model<ITokenDocument>,
  ) { }


  async isTokenValid(note: string, token: string): Promise<OperationResult<{ responseStatus: boolean }>> {
    const validToken = await this.tokenModel.findOne({ note: note });

    if (validToken?._id === token) {
      return OperationResult.ok({ responseStatus: true });
    } else {
      return OperationResult.ok({ responseStatus: false });
    }
  }
}
