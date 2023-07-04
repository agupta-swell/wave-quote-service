import { IGenericObject, IGenericObjectForGSP } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabLabel,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '5cb8e3ad-9c80-4b7a-80d6-a8b920741a1a')
@DocusignTemplate('live', '02a79d51-bdda-4eb8-a63a-1de41e40da0b')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class GridServiceAgreementTemplate {
  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabLabel('Email_1')
  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.email)
  email: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject | IGenericObjectForGSP>(ctx => {
    if ('financialProduct' in ctx) return ctx.financialProduct?.countersignerName;
    const financier = ctx.signerDetails.find(e => e.role === 'Financier');
    if (financier) return financier.fullName;
    return 'financier full name';
  })
  financierFullName: string;

  @TabValue<IGenericObject | IGenericObjectForGSP>(ctx => {
    if ('financialProduct' in ctx) return ctx.financialProduct?.countersignerTitle;
    if (ctx.utilityProgramMaster?.utilityProgramName)
      return `${ctx.utilityProgramMaster?.utilityProgramName} Program Manager`;
    return 'financier title';
  })
  financierTitle: string;

  @TabLabel('Home_Address_1&2_City_State_ZIP')
  @TabValue<IGenericObject>(
    ({ property }) =>
      `${property.address1 || ''}${property.address2 ? `, ${property.address2}` : ''}, ${property.city || ''}, ${
        property.state || ''
      } ${property.zip || ''}`,
  )
  equipmentAddress: string;
}
