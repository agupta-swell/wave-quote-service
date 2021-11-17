import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabDynamic,
} from 'src/shared/docusign';

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
@DocusignTemplate('demo', '5a055d9b-e744-4f94-a5b1-ef6b5ae4108c')
export class DisclosureEsaTemplate {
  @TabDynamic(({ assignedMember, signerDetails, financialProduct }) => {
    if (!assignedMember) {
      return {};
    }

    const {
      hisNumber,
      profile: { firstName, lastName },
    } = assignedMember;

    const obj: Record<string, unknown> = {};

    obj.salesAgentFullName = `${firstName || ''} ${lastName || ''}`.trim();

    obj.hisNumber = hisNumber;

    signerDetails.forEach(signer => {
      switch (signer.role) {
        case 'Primary Owner':
          obj.primaryOwnerFullName = signer.fullName;
          break;
        case 'Co Owner':
          obj.coOwnerFullName = signer.fullName;
          break;
        case 'Financier':
          obj.financierFullName = signer.fullName;
          obj.financierTitle = financialProduct?.countersignerTitle;
          break;
      }
    });

    return obj;
  })
  data: unknown;
}
