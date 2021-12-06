import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { CONTRACT_TYPE, KEYS } from '../constants';
import { DefaultContractNameInterceptor } from './default-contract-name.interceptor';
import { WetSignContractInterceptor } from './wet-sign-contract.interceptor';
import { VoidRelatedContractsInterceptor } from './void-contracts.interceptor';

export const UseDefaultContractName = (type?: CONTRACT_TYPE) =>
  applyDecorators(SetMetadata(KEYS.CONTRACT_TYPE, type), UseInterceptors(DefaultContractNameInterceptor));

export const UseWetSignContract = (contractIdPath: string) =>
  applyDecorators(SetMetadata(KEYS.CONTRACT_ID_PATH, contractIdPath), UseInterceptors(WetSignContractInterceptor));

export const VoidRelatedContracts = () => UseInterceptors(VoidRelatedContractsInterceptor);
