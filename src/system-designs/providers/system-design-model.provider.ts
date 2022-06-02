/* eslint-disable func-names */
import { Provider } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection, LeanDocument, Schema } from 'mongoose';
import { AsyncContextProvider } from 'src/shared/async-context/providers/async-context.provider';
import { IQueueStore } from 'src/shared/async-context/interfaces';
import { get, set } from 'lodash';
import {
  SystemDesignSchema,
  RoofTopSchema,
  SolarPanelArraySchema,
  SystemDesign,
  ILatLngSchema,
} from '../system-design.schema';
import { InitSystemDesign, ISystemDesignSchemaHook } from './ISystemDesignSchemaHook';

const patchRoofTopSchema = (patchedSolarPanelArraySchema: Schema): Schema => {
  const roofTopSchemaObj = RoofTopSchema.obj;

  const schemaDef = {
    ...roofTopSchemaObj,
    panel_array: [patchedSolarPanelArraySchema],
  };

  return new Schema(schemaDef, { _id: false });
};

const patchSystemDesignSchema = (patchedSolarPanelArraySchema: Schema) => {
  const systemDesignSchemaObj = SystemDesignSchema.obj;

  const schemaDef = {
    ...systemDesignSchemaObj,
    roof_top_design_data: patchRoofTopSchema(patchedSolarPanelArraySchema),
  };

  return new Schema(schemaDef);
};

export const createSystemDesignProvider = (
  provideKey: string,
  collectionName: string,
  hookKey: string,
  connectionName?: string,
): Provider => ({
  provide: provideKey,
  inject: [getConnectionToken(connectionName), hookKey, AsyncContextProvider],
  useFactory(connection: Connection, systemDesignHook: ISystemDesignSchemaHook, asyncContext: AsyncContextProvider) {
    const originalObjSym = Symbol('mongoOriginObj');
    const ctxStoreSym = Symbol('asyncContextStore');
    const initSystemDesignSym = Symbol('initSystemDesignSym');
    const isNewSolarPanel = Symbol('isNewSolarPanel');

    const patchedSolarPanelArraySchema = new Schema(SolarPanelArraySchema.obj, { _id: false });

    patchedSolarPanelArraySchema.pre('save', function (next) {
      const store = asyncContext.UNSAFE_getStore();

      if (store) {
        set(this, ctxStoreSym, store);
        set(this, isNewSolarPanel, this.isNew);
      }

      next();
    });

    patchedSolarPanelArraySchema.post('save', function (_, next) {
      const store: IQueueStore = get(this, ctxStoreSym);

      if (!store) {
        next();
        return;
      }

      const { isNew, systemDesign } = store.cache.get(initSystemDesignSym) as {
        isNew: boolean;
        systemDesign?: LeanDocument<SystemDesign>;
      };

      let previousBoundPolygon: ILatLngSchema[] = [];

      let previousSystemDesign: InitSystemDesign;

      if (!isNew && systemDesign) {
        previousBoundPolygon =
          (systemDesign.roofTopDesignData?.panelArray ?? []).find(
            p => p.arrayId.toString() === this.get('array_id').toString(),
          )?.boundPolygon ?? [];

        previousSystemDesign = {
          latitude: systemDesign.latitude,
          longitude: systemDesign.longitude,
          isNew,
          polygons: ((systemDesign.roofTopDesignData?.panelArray ?? []).map(p => p.boundPolygon) ?? []).flat(),
        };
      } else {
        previousSystemDesign = {
          isNew: true,
        };
      }

      const parentSystemDesign = (this.$parent()?.$parent() as unknown) as SystemDesign;

      try {
        systemDesignHook.dispatch(
          store!,
          parentSystemDesign,
          previousSystemDesign,
          this.get('array_id')?.toString(),
          previousBoundPolygon,
          get(this, isNewSolarPanel) as boolean,
          (this.toJSON() as any).boundPolygon,
        );
        next();
      } catch (err) {
        console.error('🚀 ~ file: system-design-model.provider.ts ~ line 86 ~ err', err);
        next(err);
      }
    });

    const PatchedSystemDesignSchema = patchSystemDesignSchema(patchedSolarPanelArraySchema);

    PatchedSystemDesignSchema.post('init', function () {
      // cache original lat/lng to internal model object
      set(this, originalObjSym, this.toJSON());
    });

    PatchedSystemDesignSchema.pre('save', function (next) {
      const store = asyncContext.UNSAFE_getStore();

      if (!store) {
        next();
        return;
      }

      // cache original lat/lng to context store to allow accessible inside current async context
      store?.cache.set(initSystemDesignSym, {
        isNew: this.isNew,
        ...get(this, originalObjSym),
        systemDesign: get(this, originalObjSym),
      });
      next();
    });

    return connection.model(provideKey, PatchedSystemDesignSchema, collectionName);
  },
});
