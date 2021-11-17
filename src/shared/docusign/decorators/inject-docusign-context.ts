import { Inject } from '@nestjs/common';
import { KEYS } from '../constants';

export const InjectDocusignContext = () => Inject(KEYS.CONTEXT);
