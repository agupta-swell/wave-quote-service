import { sumBy } from 'lodash';
import { IAdderQuoteDetailsSchema } from 'src/quotes/quote.schema';
import { TemplateDataBuilder } from '../../typing';

export const getSystemDesignNoticeX8Data: TemplateDataBuilder = (genericObject) => {
  const { quote: { quoteCostBuildup } } = genericObject;

  const obj = {} as any;
  obj.ES_KWH = sumBy(quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizekWh);
  obj.ES_KW = sumBy(quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizeW) / 1000;
  obj.ES_QUANTITY = sumBy(quoteCostBuildup.storageQuoteDetails, item => item.quantity);
  obj.ES_PRODUCT = quoteCostBuildup.storageQuoteDetails.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.storageModelDataSnapshot.name}`),
    '',
  );
  obj.PV_KW = sumBy(quoteCostBuildup.panelQuoteDetails, item => item.panelModelDataSnapshot.sizeW) / 1000;
  obj.PV_QUANTITY = sumBy(quoteCostBuildup.panelQuoteDetails, item => item.quantity);
  obj.PV_PRODUCT = quoteCostBuildup.panelQuoteDetails.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.panelModelDataSnapshot.name}`),
    '',
  );
  obj.INV_QUANTITY = sumBy(quoteCostBuildup.inverterQuoteDetails, item => item.quantity);
  obj.INV_PRODUCT = quoteCostBuildup.inverterQuoteDetails.reduce(
    (acc, item, index) => acc.concat(`${index === 0 ? '' : ','}${item.inverterModelDataSnapshot.name}`),
    '',
  );

  const adders = quoteCostBuildup.adderQuoteDetails.map((adderModelDataSnapshot: IAdderQuoteDetailsSchema) => ({
    name: adderModelDataSnapshot.adderModelDataSnapshot.adder,
    quantity: adderModelDataSnapshot.quantity,
  }));
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 5; i++) {
    obj[`ADDER_QUANTITY_${i + 1}`] = adders[i] ? adders[i].quantity : '';
    obj[`ADDER_NAME_${i + 1}`] = adders[i] ? adders[i].name : '';
  }

  return obj;
};
