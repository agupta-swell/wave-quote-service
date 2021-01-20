import { SetMetadata } from '@nestjs/common';

export const CUSTOM_JWT_SECRET_KEY = 'customJWTSecretKey';

export const CustomJWTSecretKey = (key: string) => SetMetadata(CUSTOM_JWT_SECRET_KEY, key);
