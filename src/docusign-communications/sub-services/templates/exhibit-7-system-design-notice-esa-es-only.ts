import { sumBy } from 'lodash';
import { ISystemDesignProducts, parseSystemDesignProducts } from 'src/docusign-communications/utils';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { roundNumber } from 'src/utils/transformNumber';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', '94df351f-f51f-4a96-9d2c-c07d911f8551')
@DocusignTemplate('live', '7e79e9ba-925b-4bd9-a7d3-ddbe202da1e9')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class Exhibit7SystemDesignNoticeEsaTemplate {
  @TabDynamic<IGenericObject>(({ systemDesign, quote }) => {
    const fields = parseSystemDesignProducts(systemDesign);

    const obj = {} as any;
    obj.es_kwh = `${roundNumber(
      sumBy(fields.systemDesignBatteries, item => item.storageModelDataSnapshot.ratings.kilowattHours * item.quantity),
      3,
    )}`;

    obj.es_kw = `${roundNumber(
      sumBy(fields.systemDesignBatteries, item => item.storageModelDataSnapshot.ratings.kilowatts * item.quantity),
      3,
    )}`;

    obj.battery_summary = fields.systemDesignBatteries
      .reduce<ISystemDesignProducts['systemDesignBatteries']>((acc, cur) => {
        const batt = acc.find(e => e.storageModelId === cur.storageModelId);

        if (batt) {
          batt.quantity += cur.quantity;
          return acc;
        }

        acc.push(cur);
        return acc;
      }, [])
      .map(
        item =>
          `${item.quantity} x ${item.storageModelDataSnapshot.$meta.manufacturer.name} ${item.storageModelDataSnapshot.name}`,
      )
      .join(', ');

    obj.adder_summary = quote.quoteCostBuildup.adderQuoteDetails
      .map(item => `${item.quantity} x ${item.adderModelDataSnapshot.name}`)
      .join(quote.quoteCostBuildup.adderQuoteDetails.length > 5 ? '\n' : ', ');

    return obj;
  })
  dynamicTabs: unknown;
}
