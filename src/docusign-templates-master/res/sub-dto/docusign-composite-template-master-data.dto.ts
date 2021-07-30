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

  @ExposeProp()
  isApplicableForChangeOrders: boolean;

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

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  updatedAt: Date;
}
