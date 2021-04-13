import { DOCUSIGN_TEMPLATE_IDS_BY_ENV } from 'src/docusign-communications/constants';
import { empty } from './empty';
import { getAdditionalTermEsaData } from './additional-term-esa';
import { getSolarEnergyDisclosureEsaData } from './solar-energy-disclosure-esa';
import { getSwellServiceEsaX1Data } from './swell-service-esa-x1';
import { getSystemDesignNoticeX8Data } from './system-design-notice-x8';
import { getCaConsumerGuideData } from './ca-consumer-guide';
import { getContractOneData } from './contract-one';
import { DocuSignEnv, TemplateBuilderMap } from '../../typing';
import { getAutoMaticPaymentAuthorizationFormFin } from './automatic-payment-authorization-form-fin';
import { getDisclosureEsaData } from './disclosure-esa';

const DOCUSIGN_ENV = (process.env.DOCUSIGN_ENV as DocuSignEnv) ?? 'demo';
const TEMPLATE_IDS = DOCUSIGN_TEMPLATE_IDS_BY_ENV[DOCUSIGN_ENV];

export const templateBuilderMap: TemplateBuilderMap = {
  [TEMPLATE_IDS.CA_CONSUMER_GUIDE]: getCaConsumerGuideData,
  [TEMPLATE_IDS.CONTRACT_ONE]: getContractOneData,
  [TEMPLATE_IDS.SOLAR_ENERGY_DISCLOSURE_ESA]: getSolarEnergyDisclosureEsaData,
  [TEMPLATE_IDS.ADDITIONAL_TERMS_ESA]: getAdditionalTermEsaData,
  [TEMPLATE_IDS.SWELL_SERVICE_ESA_X1]: getSwellServiceEsaX1Data,
  [TEMPLATE_IDS.LIMITED_WARRANTIES_ESA_X2]: empty,
  [TEMPLATE_IDS.CUSTOMER_OBLIGATIONS_X3]: empty,
  [TEMPLATE_IDS.ARBITRATION_X4]: empty,
  [TEMPLATE_IDS.NOTICE_OF_CANCELLATION_X5]: empty,
  [TEMPLATE_IDS.CA_NOTICE_AND_DISC_X6]: empty,
  [TEMPLATE_IDS.SYSTEM_DESIGN_NOTICE_X8]: getSystemDesignNoticeX8Data,
  [TEMPLATE_IDS.INSURANCE_X9]: empty,
  [TEMPLATE_IDS.AUTOMATIC_PAYMENT_AUTHORIZATION_FORM_FIN]: getAutoMaticPaymentAuthorizationFormFin,
  [TEMPLATE_IDS.DISCLOSURES_ESA]: getDisclosureEsaData,
};
