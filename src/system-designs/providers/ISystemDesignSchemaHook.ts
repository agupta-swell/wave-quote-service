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
    },
    targetPanelArrayId: string,
    previousPanelArrayBoundPolygon: ILatLngSchema[],
    isNewPanelArray: boolean,
  ): void;
}
