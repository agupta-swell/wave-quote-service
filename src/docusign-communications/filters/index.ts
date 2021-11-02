import { UseFilters } from '@nestjs/common';
import { DocusignExceptionsFilter } from './docusign-exception.filter';

export const CatchDocusignException = () => UseFilters(DocusignExceptionsFilter);
