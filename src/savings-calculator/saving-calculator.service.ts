import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ISavingsCalculatorReq, ISavingsCalculatorRes } from './interfaces';

export class SavingsCalculatorService {
  private readonly URL: string;

  constructor() {
    const { SAVINGS_CALCULATOR_URL } = process.env;

    if (!SAVINGS_CALCULATOR_URL) throw new Error('Missing SAVINGS_CALCULATOR_URL in .env');

    this.URL = SAVINGS_CALCULATOR_URL;
  }

  public async getSavings(req: ISavingsCalculatorReq): Promise<ISavingsCalculatorRes> {
    try {
      const res = await axios.post<ISavingsCalculatorRes>(this.URL, req);

      const { data } = res;

      return data;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
