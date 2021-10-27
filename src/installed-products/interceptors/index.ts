import { UseInterceptors } from '@nestjs/common';
import { ReplaceInstalledProductsInterceptor } from './replace-installed-products.interceptor';

export const ReplaceInstalledProductAfterSuccess = () => UseInterceptors(ReplaceInstalledProductsInterceptor);
