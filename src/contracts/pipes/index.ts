import { UsePipes } from '@nestjs/common';
import { DefaultFinancierPipe } from './default-financier.pipe';

export * from './signer-validation.pipe';
export * from './change-order-validation.pipe';
export * from './void-primary-contract.pipe';

export const UseDefaultFinancier = () => UsePipes(DefaultFinancierPipe);
