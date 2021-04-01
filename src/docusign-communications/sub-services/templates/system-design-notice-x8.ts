import { sumBy } from 'lodash';
import { IAdderQuoteDetailsSchema } from 'src/quotes/quote.schema';
import { TemplateDataBuilder } from '../../typing';

export const getSystemDesignNoticeX8Data: TemplateDataBuilder = (genericObject) => {
  const { quote: { quote_cost_buildup } } = genericObject;

  const obj = {} as any;
  obj.ES_KWH = sumBy(quote_cost_buildup.storage_quote_details, item => item.storage_model_data_snapshot.sizekWh);
  obj.ES_KW = sumBy(quote_cost_buildup.storage_quote_details, item => item.storage_model_data_snapshot.sizeW) / 1000;
  obj.ES_QUANTITY = sumBy(quote_cost_buildup.storage_quote_details, item => item.quantity);
  obj.ES_PRODUCT = quote_cost_buildup.storage_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.storage_model_data_snapshot.name}`),
    '',
  );
  obj.PV_KW = sumBy(quote_cost_buildup.panel_quote_details, item => item.panel_model_data_snapshot.sizeW) / 1000;
  obj.PV_QUANTITY = sumBy(quote_cost_buildup.panel_quote_details, item => item.quantity);
  obj.PV_PRODUCT = quote_cost_buildup.panel_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.panel_model_data_snapshot.name}`),
    '',
  );
  obj.INV_QUANTITY = sumBy(quote_cost_buildup.inverter_quote_details, item => item.quantity);
  obj.INV_PRODUCT = quote_cost_buildup.inverter_quote_details.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.inverter_model_data_snapshot.name}`),
    '',
  );

  const adders = quote_cost_buildup.adder_quote_details.map((adder_model_data_snapshot: IAdderQuoteDetailsSchema) => ({
    name: adder_model_data_snapshot.adder_model_data_snapshot.adder,
    quantity: adder_model_data_snapshot.quantity,
  }));
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 5; i++) {
    obj[`ADDER_QUANTITY_${i + 1}`] = adders[i] ? adders[i].quantity : '';
    obj[`ADDER_NAME_${i + 1}`] = adders[i] ? adders[i].name : '';
  }

  return obj;
};
