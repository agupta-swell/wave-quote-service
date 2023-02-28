import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { ToolTipDto } from './res/tool-tip.dto';
import { IToolTipDocument, TOOL_TIP } from './tool-tip.schema';

export class ToolTipService {
  constructor(
    @InjectModel(TOOL_TIP)
    private toolTipModel: Model<IToolTipDocument>,
  ) {}

  async getAllToolTips(): Promise<OperationResult<ToolTipDto[]>> {
    const res = await this.toolTipModel.find().lean();
    return OperationResult.ok(strictPlainToClass(ToolTipDto, res));
  }
}
