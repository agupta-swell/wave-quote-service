import { UseFilters } from '@nestjs/common';
import { QualificationExceptionsFilter } from './qualification-exception.filter';

export const CatchQualificationException = () => UseFilters(QualificationExceptionsFilter);
