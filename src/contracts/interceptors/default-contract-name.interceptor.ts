import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { CONTRACT_TYPE, KEYS, REQUEST_MODE } from '../constants';
import { ContractService } from '../contract.service';
import { SaveContractReqDto } from '../req';

interface ISaveContractReqDto {
  mode: SaveContractReqDto['mode'];
  contractDetail: Omit<SaveContractReqDto['contractDetail'], 'name'>;
}

@Injectable()
export class DefaultContractNameInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly docusignTemplateMasterService: DocusignTemplateMasterService,
    private readonly contractService: ContractService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const { body } = request as { body: ISaveContractReqDto };

    if (!body || typeof body !== 'object') {
      return next.handle();
    }

    if (body.mode === REQUEST_MODE.UPDATE) return next.handle();

    const contractType = this.reflector.get<CONTRACT_TYPE>(KEYS.CONTRACT_TYPE, context.getHandler());

    let name: string | undefined;

    switch (contractType) {
      case CONTRACT_TYPE.GRID_SERVICES_AGREEMENT:
      case CONTRACT_TYPE.PRIMARY_CONTRACT:
        name = await this.getPrimaryContractName(body.contractDetail.contractTemplateId);
        break;
      case CONTRACT_TYPE.CHANGE_ORDER:
      case CONTRACT_TYPE.NO_COST_CHANGE_ORDER:
        name = await this.getChangeOrderContractName(body.contractDetail.primaryContractId);
    }

    if (!name) {
      throw new BadRequestException('Can not find proper name');
    }

    request.body.contractDetail.name = name;
    return next.handle();
  }

  private async getChangeOrderContractName(contractId: string): Promise<string> {
    const count = await this.contractService.countContractsByPrimaryContractId(contractId);
    return `Change Order ${count + 1}`;
  }

  private async getPrimaryContractName(contractTemplateId: string): Promise<string | undefined> {
    const found = await this.docusignTemplateMasterService.getTemplateIdsInCompositeTemplate(contractTemplateId);

    return found?.filenameForDownloads;
  }
}
