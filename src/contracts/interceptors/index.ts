import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { KEYS } from '../constants';
import { WetSignContractInterceptor } from './wet-sign-contract.interceptor';
import { VoidRelatedContractsInterceptor } from './void-contracts.interceptor';

export const UseWetSignContract = (contractIdPath: string) =>
  applyDecorators(SetMetadata(KEYS.CONTRACT_ID_PATH, contractIdPath), UseInterceptors(WetSignContractInterceptor));

export const VoidRelatedContracts = () => UseInterceptors(VoidRelatedContractsInterceptor);
