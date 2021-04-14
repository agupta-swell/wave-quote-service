import { sumBy } from 'lodash';
import { TemplateDataBuilder } from 'src/docusign-communications/typing';
import { generateEPVAndGPVTable } from 'src/docusign-communications/utils';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';

export const getHomeEnergySubAgtESA: TemplateDataBuilder = genericObject => {
  const { opportunity, quote, contact, contract } = genericObject;

  const coOwner = contract.signer_details.find(e => e.role === 'Co Owner');

  const result = {} as Record<string, string>;

  result.WAVE_ID = opportunity._id;

  // Sum by net_cost
  result['Battery X'] = `${sumBy(quote.quote_cost_buildup.storage_quote_details, e => e.net_cost)}`;
  result['Solar X'] = `${sumBy(quote.quote_cost_buildup.panel_quote_details, e => e.net_cost)}`;

  result['FIRST_1 MI_1 LAST_1'] = `${contact.firstName} ${contact.lastName}`;
  result['FIRST_2 MI_2 LAST_2'] = coOwner ? `${coOwner.first_name} ${coOwner.last_name}` : '';
  result.HOME_ADDRESS_1 = contact.address1;
  result.HOME_ADDRESS_2 = contact.address2;
  result['CITY, STATE'] = `${contact.city}, ${contact.state}`;
  result.ZIP = contact.zip;
  result.EMAIL_1 = contact.email;
  result.EMAIL_2 = coOwner?.email || '';

  // Temporarily ignore applicant phone for 2
  result['TEL_1'] = contact.primaryPhone === 'HomePhone' ? contact.businessPhone! : contact.cellPhone;
  result['TEL_2'] = coOwner?.phone_number || '';

  result.GRID_PROG = quote.utility_program.utility_program_name;
  result.ES_QUANTITY = quote.quote_cost_buildup.storage_quote_details
    .map(({ quantity, storage_model_data_snapshot }) => `${quantity},${storage_model_data_snapshot.name}`)
    .join(', ');
  result.ES_PRODUCT = quote.quote_cost_buildup.storage_quote_details
    .map(({ storage_model_data_snapshot }) => storage_model_data_snapshot.name)
    .join(', ');

  // Value in KW
  result['ES_KWH | ES_KW'] = `${
    sumBy(quote.quote_cost_buildup.storage_quote_details, e => e.storage_model_data_snapshot.sizeW) / 1000
  }`;

  result.PV_QUANTITY = quote.quote_cost_buildup.panel_quote_details
    .map(({ quantity, panel_model_data_snapshot }) => `${quantity},${panel_model_data_snapshot.name}`)
    .join(', ');

  result.PV_PRODUCT = quote.quote_cost_buildup.panel_quote_details
    .map(({ panel_model_data_snapshot }) => panel_model_data_snapshot.name)
    .join(', ');

  // Value in KW
  result.PV_KW = `${
    sumBy(quote.quote_cost_buildup.panel_quote_details, e => e.panel_model_data_snapshot.sizeW) / 1000
  }`;

  result.INV_QUANTITY = quote.quote_cost_buildup.inverter_quote_details
    .map(({ quantity, inverter_model_data_snapshot }) => `${quantity},${inverter_model_data_snapshot.name}`)
    .join(', ');

  // TODO [Docusign Yes/No]
  // Appointed another response party?
  // Granted rights to other party?
  result['Docusign Yes/No'] = quote.is_retrofit.toString();

  const leaseProductAttribute = quote.quote_finance_product.finance_product
    .product_attribute as ILeaseProductAttributes;

  result.ESA_YRS = `${leaseProductAttribute.lease_term}`;
  result.ESA_MOS = `${leaseProductAttribute.lease_term * 12}`;
  result.ESA_ESC = `${leaseProductAttribute.rate_escalator}`;

  result.ESA_PMT1 = `${
    Array.isArray(leaseProductAttribute.yearly_lease_payment_details?.[0]?.monthly_payment_details) &&
    leaseProductAttribute.yearly_lease_payment_details[0]?.monthly_payment_details[0].payment_amount
  }`;

  result.ESA_PMT_CUM = `${leaseProductAttribute.lease_amount}`;

  const { EPV_YLD, EPV_YLD_CUM, GPV_YLD } = generateEPVAndGPVTable({
    systemProduction: quote.system_production,
    quote,
  });

  result.EPV_YLD_YR1 = `${EPV_YLD[0]}`;
  result.EPV_YLD_CUM = `${EPV_YLD_CUM[EPV_YLD_CUM.length - 1]}`;

  result.GPV_YLD_YR1 = `${GPV_YLD[0]}`;
  result.GPV_YLD_CUM = `${sumBy(GPV_YLD, e => e)}`;

  return result;
};
