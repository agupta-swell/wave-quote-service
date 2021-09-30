import { DocuSignEnv, IDocusignTemplateMapping } from './typing';

export const DOCUSIGN_TEMPLATE_IDS_BY_ENV: Record<DocuSignEnv, IDocusignTemplateMapping> = {
  demo: {
    CA_CONSUMER_GUIDE: 'f3e2597c-af8e-4718-8d7b-44cf63f19ea5',
    CONTRACT_ONE: '864dead0-03df-4a5a-b83c-ffb0d0c5f588',
    SOLAR_ENERGY_DISCLOSURE_ESA: '5a055d9b-e744-4f94-a5b1-ef6b5ae4108c',
    DISCLOSURES_ESA: '75e11c9d-aaff-440b-a7a7-c789659c8985',
    ADDITIONAL_TERMS_ESA: 'c40d9d52-08ba-4c12-9ad2-9f781fb354b4',
    SWELL_SERVICE_ESA_X1: '60e693c1-1858-4aa2-9105-8dfa1f3d7562',
    LIMITED_WARRANTIES_ESA_X2: 'fa8c97c9-097c-4af5-9b88-c2dd7c08340c',
    CUSTOMER_OBLIGATIONS_X3: '1884a5a2-7804-48bc-9cb2-741ad34bbfcb',
    ARBITRATION_X4: 'e511b51a-2e47-4985-b6b0-3b389cfcce20',
    NOTICE_OF_CANCELLATION_X5: '1451f1e2-4620-4878-b74b-7bea35bd6f9b',
    CA_NOTICE_AND_DISC_X6: '9ad997b4-b94c-4979-9b01-e9ea49f039f9',
    SYSTEM_DESIGN_NOTICE_X8: '734c08f1-c7c1-44d9-9247-641fd0e547a8',
    INSURANCE_X9: '18d5b637-49d9-4446-827c-13fa82179529',
    AUTOMATIC_PAYMENT_AUTHORIZATION_FORM_FIN: '31bfa343-a279-43a4-aa54-f2d2d31b33ef',
    PARTICIPATION_PRP2_ACES_CASH: 'fecadd5d-2ffe-4266-8e4a-775586a09220',
    PARTICIPATION_PRP2_ACES_ESA: 'fecadd5d-2ffe-4266-8e4a-775586a09220',
    SOLAR_ENERGY_SYSTEM_ESTIMATED_X7: '907c8e4d-8f4c-4494-a443-93c34c533beb',
    GRID_SERVICES_AGT: 'd1814a3c-4ecc-43c5-b548-0a198569f2ef',
    HOME_ENERGY_SUB_AGT_ESA: 'ec44e32a-403e-41de-b542-0a89e27a631b',
    PAYMENT_SCHEDULE_X10: 'd7758c3f-82bc-4d7d-93f2-2c939c661f18',
    DUMMY_CHANGE_ORDER: 'f880c5fa-28eb-4b63-b974-3e5290792ef9',
    DUMMY_PRIMARY_CONTRACT: '67aa9e1d-aaef-46db-8f70-e23f392a10b2',
    DUMMY_GSA: '6ae2b971-373d-4db1-8c20-758dda9c77d9',
    DUMMY_ACES_PA: 'ffaf103b-4957-47bb-835a-61035b0d0274',
    DUMMY_PRP2_PA: '3d23bf08-36fc-48d1-a8be-81495e4da4a2',
    DUMMY_SGIP_PA: '254881b3-9c75-43bb-a5a9-5206897d5c1a',
  },
  live: {
    CA_CONSUMER_GUIDE: '0',
    CONTRACT_ONE: '0',
    SOLAR_ENERGY_DISCLOSURE_ESA: '1',
    DISCLOSURES_ESA: '1',
    ADDITIONAL_TERMS_ESA: '1',
    SWELL_SERVICE_ESA_X1: '1',
    LIMITED_WARRANTIES_ESA_X2: '1',
    CUSTOMER_OBLIGATIONS_X3: '1',
    ARBITRATION_X4: '1',
    NOTICE_OF_CANCELLATION_X5: '1',
    CA_NOTICE_AND_DISC_X6: '1',
    SYSTEM_DESIGN_NOTICE_X8: '1',
    INSURANCE_X9: '1',
    AUTOMATIC_PAYMENT_AUTHORIZATION_FORM_FIN: '1',
    PARTICIPATION_PRP2_ACES_CASH: '1',
    PARTICIPATION_PRP2_ACES_ESA: '1',
    SOLAR_ENERGY_SYSTEM_ESTIMATED_X7: '1',
    GRID_SERVICES_AGT: '1',
    HOME_ENERGY_SUB_AGT_ESA: '1',
    PAYMENT_SCHEDULE_X10: '1',
    DUMMY_CHANGE_ORDER: '1',
    DUMMY_PRIMARY_CONTRACT: '1',
    DUMMY_GSA: '0',
    DUMMY_ACES_PA: '0',
    DUMMY_PRP2_PA: '0',
    DUMMY_SGIP_PA: '0',
  },
};
