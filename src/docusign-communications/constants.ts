import { DocuSignEnv, IDocusignTemplateMapping } from './typing';

export const DOCUSIGN_TEMPLATE_IDS_BY_ENV: Record<DocuSignEnv, IDocusignTemplateMapping>= {
  demo: {
    CA_CONSUMER_GUIDE: '50bf8fd6-cf25-4ee0-b63d-2720e66a4789',
    CONTRACT_ONE: '864dead0-03df-4a5a-b83c-ffb0d0c5f588',
    SOLAR_ENERGY_DISCLOSURE_ESA: '5a055d9b-e744-4f94-a5b1-ef6b5ae4108c',
    DISCLOSURES_ESA: '75e11c9d-aaff-440b-a7a7-c789659c8985',
    ADDITIONAL_TERMS_ESA: 'c40d9d52-08ba-4c12-9ad2-9f781fb354b4',
    SWELL_SERVICE_ESA_X1: '60e693c1-1858-4aa2-9105-8dfa1f3d7562',
    SYSTEM_DESIGN_NOTICE_X8: '734c08f1-c7c1-44d9-9247-641fd0e547a8',
  },
  live: {
    CA_CONSUMER_GUIDE: '0',
    CONTRACT_ONE: '0',
    SOLAR_ENERGY_DISCLOSURE_ESA: '1',
    DISCLOSURES_ESA: '1',
    ADDITIONAL_TERMS_ESA: '1',
    SWELL_SERVICE_ESA_X1: '1',
    SYSTEM_DESIGN_NOTICE_X8: '1',
  },
};
