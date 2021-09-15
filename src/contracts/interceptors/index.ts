import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { CONTRACT_TYPE, KEYS } from '../constants';
import { DefaultContractNameInterceptor } from './default-contract-name.interceptor';

export const UseDefaultContractName = (type?: CONTRACT_TYPE) =>
  applyDecorators(SetMetadata(KEYS.CONTRACT_TYPE, type), UseInterceptors(DefaultContractNameInterceptor));
