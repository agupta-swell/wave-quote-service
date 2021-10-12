import { SetMetadata } from '@nestjs/common';
import { KEYS } from './constants';

/**
 * Define custom secret key for applied route
 *
 * Path must include query `?key=jwt-token-format`
 * @param secret
 * @returns
 */
export const ResourceGuard = (secret: string) => SetMetadata(KEYS.RESOURCE_SCOPED, secret);
