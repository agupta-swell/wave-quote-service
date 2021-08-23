import { UsePipes } from '@nestjs/common';
import { DefaultFinancierPipe } from './default-financier.pipe';

export const UseDefaultFinancier = () => UsePipes(DefaultFinancierPipe);
