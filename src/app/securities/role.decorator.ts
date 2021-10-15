import { SetMetadata } from '@nestjs/common';
import { KEYS } from './constants';

/**
 * Define a set of allowed roles to exec current route handler
 * @param roles
 * @returns
 */
export const Role = (...roles: string[]) => SetMetadata(KEYS.ROLES, roles);
