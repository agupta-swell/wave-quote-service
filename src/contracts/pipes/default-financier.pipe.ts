import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { Types } from 'mongoose';
import { DocusignTemplateMasterService } from 'src/docusign-templates-master/docusign-template-master.service';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { REQUEST_MODE } from '../constants';
import { SaveContractReqDto } from '../req';

@Injectable()
export class DefaultFinancierPipe implements PipeTransform<SaveContractReqDto, Promise<SaveContractReqDto>> {
  private _financierRoleId: string | undefined;

  constructor(
    private readonly docusignTemplateMasterService: DocusignTemplateMasterService,
    private readonly financialProductsService: FinancialProductsService,
  ) {}

  async cacheFinancierRoleId(): Promise<string> {
    const found = await this.docusignTemplateMasterService.getSignerRoleMasterByRoleName('Financier');

    if (!found) {
      throw new Error('No role found with name Financier');
    }

    const id = found._id.toString();

    this._financierRoleId = id;

    return id;
  }

  async transform(value: SaveContractReqDto, metadata: ArgumentMetadata): Promise<SaveContractReqDto> {
    if (metadata.type !== 'body') {
      return value;
    }

    if (value.mode === REQUEST_MODE.UPDATE) return value;

    const financierId = this._financierRoleId || (await this.cacheFinancierRoleId());

    const countersigner = await this.financialProductsService.getOneByQuoteId(
      new Types.ObjectId(value.contractDetail.associatedQuoteId) as any,
    );

    if (!countersigner) {
      return value;
    }

    const signer = {
      roleId: financierId,
      role: 'Financier',
      firstName: '',
      lastName: countersigner.countersignerName,
      email: countersigner.countersignerEmail,
    };

    if (Array.isArray(value.contractDetail.signerDetails)) {
      const foundIdx = value.contractDetail.signerDetails.findIndex(e => e.roleId === financierId);

      if (foundIdx === -1) {
        value.contractDetail.signerDetails.push(signer);
        return value;
      }

      value.contractDetail.signerDetails[foundIdx] = signer;

      return value;
    }

    value.contractDetail.signerDetails = [signer];

    return value;
  }
}
