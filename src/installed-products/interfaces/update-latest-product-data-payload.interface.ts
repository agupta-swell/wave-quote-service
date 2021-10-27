import { IRoofTopSchema } from 'src/system-designs/system-design.schema';

export interface IUpdateLatestProductDataPayload
  extends Omit<IRoofTopSchema, 'adders' | 'balanceOfSystems' | 'keepouts'> {}
