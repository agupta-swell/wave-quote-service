import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { ValidateUploadBatteryAssetsInterceptor } from './validate-upload-battery-assets.interceptor';
import { KEYS } from '../constants';

export const UseUploadBatteryAssetsValidation = (batteryIdPath: string) =>
  applyDecorators(
    SetMetadata(KEYS.REQ_PARAM_ID, batteryIdPath),
    UseInterceptors(ValidateUploadBatteryAssetsInterceptor),
  );

export * from './validate-upload-battery-assets.interceptor';
