import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, USER } from 'src/users/user.schema';
import { IDefaultContractor, IGenericObject, ITabData } from '../typing';
import { templateBuilderMap } from './templates';

@Injectable()
export class DocusignTemplateService {
  constructor(@InjectModel(USER) private userModel: Model<User>) {}

  buildTemplateData(
    docusignTemplateId: string,
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ITabData {
    const assignedMember = genericObject.opportunity.assignedMember;
    // const user = await this.userModel.findById(assignedMember);
    const templateDataBuilder = templateBuilderMap[docusignTemplateId];

    if (!templateDataBuilder) {
      throw new Error(`No mapping for DocuSign template id: ${docusignTemplateId}`);
    }
    // if (!user) {
    //   throw new Error(`No User for DocuSign template id: ${docusignTemplateId}`);
    // } else {
    //   const disclosureEsa: IDisclosureEsaMapping = {
    //     salesPersonFirstLast: `${user.profile.firstName} ${user.profile.firstName} `,
    //     hisSale: user.hisNumber,
    //   };
    //   genericObject.assignedMember = disclosureEsa;
    // }
    const tabs = templateBuilderMap[docusignTemplateId](genericObject, defaultContractor);
    return { textTabs: [tabs] };
  }
}
