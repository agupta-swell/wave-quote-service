import { Inject } from '@nestjs/common';
import { KEYS } from './constants';

export const MongooseNamingStrategyOpts = () => Inject(KEYS.NAMING_OPTIONS);
