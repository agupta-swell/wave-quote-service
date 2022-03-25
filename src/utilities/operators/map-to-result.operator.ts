import { map } from 'rxjs/operators';
import { IGetTypicalUsageKwh, BaseActualUsageConstructor } from '../sub-services';

export const mapToResult = <R>(Cls: BaseActualUsageConstructor<any, R>) =>
  map<IGetTypicalUsageKwh, R>(res => new Cls(res));
