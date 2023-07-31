import {V2EsaPricingSolverDocument} from "./v2-esa-pricing-solver";

export interface V2EsaPricingCalculation {
  payment: number,
  pkWh: number | null,
  solverRow: V2EsaPricingSolverDocument,
  errors: string[],
}