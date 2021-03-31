import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, USER } from 'src/users/user.schema';
import { IDefaultContractor, IDisclosureEsaMapping, IGenericObject, ITabData } from '../typing';
import { templateBuilderMap } from './templates';

@Injectable()
export class DocusignTemplateService {
  constructor(@InjectModel(USER) private readonly userModel: Model<User>) {}

  buildTemplateData(
    docusignTemplateId: string,
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ITabData {
    const assignedMember = genericObject.opportunity.assignedMember;
    const user: any = this.userModel.findOne({ _id: assignedMember });
    const templateDataBuilder = templateBuilderMap[docusignTemplateId];

    if (!templateDataBuilder) {
      throw new Error(`No mapping for DocuSign template id: ${docusignTemplateId}`);
    }
    const disclosureEsa :IDisclosureEsaMapping = {
      salesPersonFirstLast: `${user.profile.firstName} ${user.profile.firstName} `,
      hisSale: user.hisNumber,
    };
    const tabs = templateBuilderMap[docusignTemplateId](genericObject, defaultContractor,disclosureEsa);
    return { textTabs: [tabs] };
  }
}
