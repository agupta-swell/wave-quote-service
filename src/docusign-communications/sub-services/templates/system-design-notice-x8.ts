import { sumBy } from 'lodash';
import { TemplateDataBuilder } from '../../typing';

// @ts-ignore TODO: fix typing
export const getSystemDesignNoticeX8Data: TemplateDataBuilder = ({ costBuildup }) => {
  const obj = {} as any;
  // @ts-ignore TODO: fix typing
  const adderQuantity = sumBy(costBuildup.adder_quote_details, item => item.quantity);
  const adderName = costBuildup.adder_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.adder_model_data_snapshot.adder}`),
    '',
  );
  // @ts-ignore TODO: fix typing
  obj.ES_KWH = sumBy(costBuildup.storage_quote_details, item => item.storage_model_data_snapshot.sizekWh);
  // @ts-ignore TODO: fix typing
  obj.ES_KW = sumBy(costBuildup.storage_quote_details, item => item.storage_model_data_snapshot.sizeW) / 1000;
  // @ts-ignore TODO: fix typing
  obj.ES_QUANTITY = sumBy(costBuildup.storage_quote_details, item => item.quantity);
  obj.ES_PRODUCT = costBuildup.storage_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.storage_model_data_snapshot.name}`),
    '',
  );
  // @ts-ignore TODO: fix typing
  obj.PV_KW = sumBy(costBuildup.panel_quote_details, item => item.panel_model_data_snapshot.sizeW) / 1000;
  // @ts-ignore TODO: fix typing
  obj.PV_QUANTITY = sumBy(costBuildup.panel_quote_details, item => item.quantity);
  obj.PV_PRODUCT = costBuildup.panel_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.panel_model_data_snapshot.name}`),
    '',
  );
  // @ts-ignore TODO: fix typing
  obj.INV_QUANTITY = sumBy(costBuildup.inverter_quote_details, item => item.quantity);
  obj.INV_PRODUCT = costBuildup.inverter_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.inverter_model_data_snapshot.name}`),
    '',
  );
  obj.ADDER_QUANTITY_1 = adderQuantity;
  obj.ADDER_NAME_1 = adderName;
  obj.ADDER_QUANTITY_2 = adderQuantity;
  obj.ADDER_NAME_2 = adderName;
  obj.ADDER_QUANTITY_3 = adderQuantity;
  obj.ADDER_NAME_3 = adderName;
  obj.ADDER_QUANTITY_4 = adderQuantity;
  obj.ADDER_NAME_4 = adderName;
  obj.ADDER_QUANTITY_5 = adderQuantity;
  obj.ADDER_NAME_5 = adderName;

  return obj;
};
