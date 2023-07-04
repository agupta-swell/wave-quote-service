import { sumBy } from 'lodash';
import { IGenericObject } from 'src/docusign-communications/typing';
import { generateEPVAndGPVTable } from 'src/docusign-communications/utils';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { FINANCE_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

@DocusignTemplate('demo', 'ec44e32a-403e-41de-b542-0a89e27a631b')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class HomeEnergySubAgtESATemplate {
  @TabDynamic<IGenericObject>(genericObject => {
    const { opportunity, quote, contact, signerDetails, property } = genericObject;

    const coOwner = signerDetails.find(e => e.role === 'Co Owner');

    const result = {} as Record<string, string>;

    result.WAVE_ID = opportunity._id;

    // Sum by net_cost
    result['Battery X'] = `${sumBy(quote.quoteCostBuildup.storageQuoteDetails, e => e.netCost)}`;
    result['Solar X'] = `${sumBy(quote.quoteCostBuildup.panelQuoteDetails, e => e.netCost)}`;

    result['FIRST_1 MI_1 LAST_1'] = `${contact.firstName} ${contact.lastName}`;
    result['FIRST_2 MI_2 LAST_2'] = coOwner ? `${coOwner.fullName}` : '';
    result.HOME_ADDRESS_1 = property.address1 || '';
    result.HOME_ADDRESS_2 = property?.address2 || '';
    result['CITY, STATE'] = `${property.city}, ${property.state}`;
    result.ZIP = property.zip || '';
    result.EMAIL_1 = contact.email;
    result.EMAIL_2 = coOwner?.email || '';

    // Temporarily ignore applicant phone for 2
    result.TEL_1 = contact.primaryPhone === 'HomePhone' ? contact.businessPhone || '' : contact.cellPhone || '';
    result.TEL_2 = coOwner?.phoneNumber || '';

    result.GRID_PROG = quote.utilityProgram?.utilityProgramName ?? 'none';
    result.ES_QUANTITY = quote.quoteCostBuildup.storageQuoteDetails
      .map(({ quantity, storageModelDataSnapshot }) => `${quantity},${storageModelDataSnapshot.name}`)
      .join(', ');
    result.ES_PRODUCT = quote.quoteCostBuildup.storageQuoteDetails
      .map(({ storageModelDataSnapshot }) => storageModelDataSnapshot.name)
      .join(', ');

    // Value in KW
    result['ES_KWH | ES_KW'] = `${sumBy(
      quote.quoteCostBuildup.storageQuoteDetails,
      e => e.storageModelDataSnapshot.ratings.kilowatts,
    )}`;

    result.PV_QUANTITY = quote.quoteCostBuildup.panelQuoteDetails
      .map(({ quantity, panelModelDataSnapshot }) => `${quantity},${panelModelDataSnapshot.name}`)
      .join(', ');

    result.PV_PRODUCT = quote.quoteCostBuildup.panelQuoteDetails
      .map(({ panelModelDataSnapshot }) => panelModelDataSnapshot.name)
      .join(', ');

    // Value in KW
    result.PV_KW = `${
      sumBy(quote.quoteCostBuildup.panelQuoteDetails, e => e.panelModelDataSnapshot.ratings.watts) / 1000
    }`;

    result.INV_QUANTITY = quote.quoteCostBuildup.inverterQuoteDetails
      .map(({ quantity, inverterModelDataSnapshot }) => `${quantity},${inverterModelDataSnapshot.name}`)
      .join(', ');

    // Current solar energy system?
    result.ExistingSolar_Yes = opportunity.existingPV ? '1' : '';
    result.ExistingSolar_No = !opportunity.existingPV ? '1' : '';

    // Owned by Third Party?
    result.CustomerOwned = opportunity.financeType !== FINANCE_TYPE_EXISTING_SOLAR.TPO ? '1' : '';
    result.ThirdPartyOwned = opportunity.financeType === FINANCE_TYPE_EXISTING_SOLAR.TPO ? '1' : '';

    // Appointed another response party?
    result.DemandResponse_Yes = opportunity.hasHadOtherDemandResponseProvider ? '1' : '';
    result.DemandResponse_No = !opportunity.hasHadOtherDemandResponseProvider ? '1' : '';

    // Granted rights to other party?
    result.GrantedRights_Yes = opportunity.hasGrantedHomeBatterySystemRights ? '1' : '';
    result.GrantedRights_No = !opportunity.hasGrantedHomeBatterySystemRights ? '1' : '';

    const leaseProductAttribute = quote.quoteFinanceProduct.financeProduct.productAttribute as ILeaseProductAttributes;

    result.ESA_YRS = `${leaseProductAttribute.leaseTerm}`;
    result.ESA_MOS = `${leaseProductAttribute.leaseTerm * 12}`;
    result.ESA_ESC = `${leaseProductAttribute.rateEscalator}`;

    result.ESA_PMT1 = `${
      Array.isArray(leaseProductAttribute.yearlyLeasePaymentDetails?.[0]?.monthlyPaymentDetails) &&
      leaseProductAttribute.yearlyLeasePaymentDetails[0]?.monthlyPaymentDetails[0].paymentAmount
    }`;

    result.ESA_PMT_CUM = `${leaseProductAttribute.leaseAmount}`;

    const { EPV_YLD, EPV_YLD_CUM, GPV_YLD } = generateEPVAndGPVTable({
      systemProduction: quote.systemProduction,
      quote,
    });

    result.EPV_YLD_YR1 = `${EPV_YLD[0]}`;
    result.EPV_YLD_CUM = `${EPV_YLD_CUM[EPV_YLD_CUM.length - 1]}`;

    result.GPV_YLD_YR1 = `${GPV_YLD[0]}`;
    result.GPV_YLD_CUM = `${sumBy(GPV_YLD, e => e)}`;

    return result;
  })
  dynamicTabs: unknown;
}
