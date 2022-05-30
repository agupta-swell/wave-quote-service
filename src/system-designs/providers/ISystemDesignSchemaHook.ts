import { IQueueStore } from 'src/shared/async-context/interfaces';
import { ILatLngSchema, SystemDesign } from '../system-design.schema';

export interface ISystemDesignSchemaHook {
  dispatch(
    asyncQueueStore: IQueueStore,
    systemDesign: SystemDesign,
    initSystemDesign: {
      latitude: number;
      longitude: number;
      isNew: boolean;
      polygons: ILatLngSchema[];
    },
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    isNewPanelArray: boolean,
    newPanelArrayBoundPolygon: ILatLngSchema[],
  ): void;
}
