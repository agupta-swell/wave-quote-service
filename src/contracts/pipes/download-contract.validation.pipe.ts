import { PipeTransform, Injectable, ArgumentMetadata, NotFoundException } from '@nestjs/common';
import { ObjectId, Types } from 'mongoose';
import { DOWNLOADABLE_RESOURCE, IDownloadResourcePayload } from 'src/app/securities';
import { ContractService } from '../contract.service';

export interface IContractDownloadReqPayload {
  filename: string;
  contentType: string;
  envelopeId: string;
}

@Injectable()
export class DownloadContractPipe
  implements PipeTransform<IDownloadResourcePayload, Promise<IContractDownloadReqPayload>> {
  constructor(private readonly contractService: ContractService) {}

  async transform(value: IDownloadResourcePayload): Promise<IContractDownloadReqPayload> {
    const { contentType, filename, resourceId, type } = value;

    if (type !== DOWNLOADABLE_RESOURCE.CONTRACT) {
      throw new NotFoundException();
    }

    const contract = await this.contractService.getOneByContractId(
      (new Types.ObjectId(resourceId) as unknown) as ObjectId,
    );

    if (!contract.contractingSystemReferenceId) {
      throw new NotFoundException();
    }

    return {
      contentType,
      filename,
      envelopeId: contract.contractingSystemReferenceId,
    };
  }
}
