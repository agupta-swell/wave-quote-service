import { UseRouteMapper } from 'src/shared/route-mapper';
import { DOCUSIGN_ROUTE } from '../constants';

export const UseDocusignContext = (): MethodDecorator => UseRouteMapper(DOCUSIGN_ROUTE);
