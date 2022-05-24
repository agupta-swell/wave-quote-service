/* eslint-disable func-names */
import { Provider } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection, Schema } from 'mongoose';
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
import { ISystemDesignSchemaHook } from './ISystemDesignSchemaHook';

const patchRoofTopSchema = (patchedSolarPanelArraySchema: Schema): Schema => {
  const roofTopSchemaObj = RoofTopSchema.obj;

  roofTopSchemaObj.panel_array = [patchedSolarPanelArraySchema];

  return new Schema(roofTopSchemaObj, { _id: false });
};

const patchSystemDesignSchema = (patchedSolarPanelArraySchema: Schema) => {
  const systemDesignSchemaObj = SystemDesignSchema.obj;

  systemDesignSchemaObj.roof_top_design_data = patchRoofTopSchema(patchedSolarPanelArraySchema);

  return new Schema(systemDesignSchemaObj);
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

    SolarPanelArraySchema.pre('save', function (next) {
      const store = asyncContext.UNSAFE_getStore();

      if (!store) {
        return;
      }

      set(this, ctxStoreSym, store);
      next();
    });

    SolarPanelArraySchema.post('init', function () {
      // cache orignal value to perform later comparison
      set(this, originalObjSym, this.toJSON());
    });

    SolarPanelArraySchema.post('save', function (_, next) {
      const store: IQueueStore = get(this, ctxStoreSym);

      if (!store) {
        next();
        return;
      }

      const previousBoundPolygon: ILatLngSchema[] = get(this, originalObjSym)?.bound_polygon;

      const parentSystemDesign = (this.$parent()?.$parent() as unknown) as SystemDesign;

      const previousSystemDesignLatLng = store?.cache.get(initSystemDesignSym) as {
        latitude: number;
        longitude: number;
        isNew: boolean;
      };

      try {
        systemDesignHook.dispatch(
          store!,
          parentSystemDesign,
          previousSystemDesignLatLng,
          this.get('id')?.toString(),
          previousBoundPolygon,
          this.isNew,
        );
        next();
      } catch (err) {
        console.error('🚀 ~ file: system-design-model.provider.ts ~ line 86 ~ err', err);
        next(err);
      }
    });

    const PatchedSystemDesignSchema = patchSystemDesignSchema(SolarPanelArraySchema);

    PatchedSystemDesignSchema.post('init', function (res) {
      // cache original lat/lng to internal model object
      set(this, originalObjSym, {
        latitude: res.latitude,
        longitude: res.longitude,
      });
    });

    PatchedSystemDesignSchema.pre('save', function () {
      const store = asyncContext.UNSAFE_getStore();

      if (!store) {
        return;
      }

      // cache original lat/lng to context store to allow accessible inside current async context
      store?.cache.set(initSystemDesignSym, {
        isNew: this.isNew,
        ...get(this, originalObjSym),
      });
    });

    return connection.model(provideKey, PatchedSystemDesignSchema, collectionName);
  },
});
