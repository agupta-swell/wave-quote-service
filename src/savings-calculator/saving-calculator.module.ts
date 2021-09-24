import { Module } from '@nestjs/common';
import { SavingsCalculatorService } from './saving-calculator.service';

@Module({
  providers: [SavingsCalculatorService],
  exports: [SavingsCalculatorService],
})
export class SavingsCalculatorModule {}
