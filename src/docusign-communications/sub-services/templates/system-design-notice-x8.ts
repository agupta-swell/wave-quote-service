import { sumBy } from 'lodash';
import { IQuoteCostBuildupSchema } from 'src/quotes/quote.schema';

// TODO: consider this parameter type. As now, I assume below type

export function getSystemDesignNoticeX8Data(costBuildup: IQuoteCostBuildupSchema) {
  const obj = {} as any;
  const adderQuantity = sumBy(costBuildup.adder_quote_details, item => item.quantity);
  const adderName = costBuildup.adder_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.adder_model_data_snapshot.adder}`),
    '',
  );
  obj.ES_KWH = sumBy(costBuildup.storage_quote_details, item => item.storage_model_data_snapshot.sizekWh);
  obj.ES_KW = sumBy(costBuildup.storage_quote_details, item => item.storage_model_data_snapshot.sizeW) / 1000;
  obj.ES_QUANTITY = sumBy(costBuildup.storage_quote_details, item => item.quantity);
  obj.ES_PRODUCT = costBuildup.storage_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.storage_model_data_snapshot.name}`),
    '',
  );
  obj.PV_KW = sumBy(costBuildup.panel_quote_details, item => item.panel_model_data_snapshot.sizeW) / 1000;
  obj.PV_QUANTITY = sumBy(costBuildup.panel_quote_details, item => item.quantity);
  obj.PV_PRODUCT = costBuildup.panel_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.panel_model_data_snapshot.name}`),
    '',
  );
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
}
