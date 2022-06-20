import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { ValidateUploadSystemDesignThumbnailInterceptor } from './validate-upload-system-design-thumbnail.interceptor';
import { KEYS } from '../constants';

export const UseUploadThumbnailValidation = (systemDesignIdPath: string) =>
  applyDecorators(
    SetMetadata(KEYS.REQ_PARAM_ID, systemDesignIdPath),
    UseInterceptors(ValidateUploadSystemDesignThumbnailInterceptor),
  );

export * from './validate-upload-system-design-thumbnail.interceptor';
