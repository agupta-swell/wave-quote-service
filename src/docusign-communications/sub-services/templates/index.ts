import { DOCUSIGN_TEMPLATE, DOCUSIGN_TEMPLATE_1 } from 'src/docusign-communications/constants';
import { getAddtionalTermEsaData } from './additional-term-esa';
import { getSolarEnergyDisclosureEsaData } from './solar-energy-disclosure-esa';
import { getSwellServiceEsaX1Data } from './swell-service-esa-x1';
import { getSystemDesignNoticeX8Data } from './system-design-notice-x8';
import { getTemplate1Data } from './template-1';
import { getTemplate2Data } from './template-2';

const SALESFORCE_ENV = <'testing' | 'production'>(process.env.SALESFORCE_ENV ?? 'testing');
const DOCUSIGN_ENV = DOCUSIGN_TEMPLATE_1[SALESFORCE_ENV];

export const mapTemplateById = {
  [DOCUSIGN_TEMPLATE.first]: getTemplate1Data,
  [DOCUSIGN_TEMPLATE.second]: getTemplate2Data,
  [DOCUSIGN_ENV.SOLAR_ENERGY_DISCLOSURE_ESA]: getSolarEnergyDisclosureEsaData,
  [DOCUSIGN_ENV.ADDITIONAL_TERMS_ESA]: getAddtionalTermEsaData,
  [DOCUSIGN_ENV.SWELL_SERVICE_ESA_X1]: getSwellServiceEsaX1Data,
  [DOCUSIGN_ENV.SYSTEM_DESIGN_NOTICE_X8]: getSystemDesignNoticeX8Data,
};
