import { IQueueStore } from 'src/shared/async-context/interfaces';
import { ILatLngSchema, SystemDesign } from '../system-design.schema';

export type InitSystemDesign =
  | {
      isNew: true;
    }
  | {
      latitude: number;
      longitude: number;
      isNew: false;
      polygons: ILatLngSchema[];
      totalArrays: number;
      previousDrift: {
        x: number;
        y: number;
      };
    };

export interface ISystemDesignSchemaHook {
  dispatch(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    initSystemDesign: InitSystemDesign,
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    previousTotalPanelsInArray: number,
    isNewPanelArray: boolean,
    newPanelArrayBoundPolygon: ILatLngSchema[],
    newTotalPanelsInArray: number,
  ): void;
}
