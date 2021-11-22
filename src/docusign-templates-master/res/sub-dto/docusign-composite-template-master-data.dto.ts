import { CONTRACT_TYPE } from 'src/contracts/constants';
import { SYSTEM_TYPE } from 'src/docusign-templates-master/constants';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class DocusignCompositeTemplateMasterDataResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  description: string;

  @ExposeProp({ type: String, isArray: true })
  docusignTemplateIds: string[];

  @ExposeProp({ enum: CONTRACT_TYPE, type: String })
  type: CONTRACT_TYPE;

  @ExposeProp({ required: false })
  filenameForDownloads: string;

  @ExposeProp({ type: String, isArray: true })
  applicableRebatePrograms: string[];

  @ExposeProp({ type: String, isArray: true })
  applicableFundingSources: string[];

  @ExposeProp({ type: String, isArray: true })
  applicableUtilityPrograms: string[];

  @ExposeProp({ type: String, isArray: true })
  applicableUtilities: string[];

  @ExposeProp({ type: String, isArray: true })
  applicableStates: string[];

  @ExposeProp({ enum: SYSTEM_TYPE, type: String, isArray: true })
  applicableSystemTypes: SYSTEM_TYPE[];

  @ExposeProp({ type: String })
  beginPageNumberingTemplateId: string;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  updatedAt: Date;
}
