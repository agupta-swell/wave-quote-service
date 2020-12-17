import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DOCUSIGN, Docusign } from './docusign.schema';

@Injectable()
export class DocusignService {
  constructor(@InjectModel(DOCUSIGN) private readonly docusignModel: Model<Docusign>) {}

  // =====================> INTERNAL <=====================
}
