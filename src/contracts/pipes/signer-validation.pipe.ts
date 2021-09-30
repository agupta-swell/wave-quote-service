import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { SaveContractReqDto } from '../req';
import { SignerDetailDto } from '../req/sub-dto/signer-detail.dto';

@Injectable()
export class SignerValidationPipe implements PipeTransform<SaveContractReqDto, SaveContractReqDto> {
  transform(value: SaveContractReqDto, _: ArgumentMetadata) {
    value.contractDetail.signerDetails.forEach(e => {
      if (e.role === 'Co Owner') {
        if ((e.email || e.fullName) && !this.validateSigner(e)) {
          throw new BadRequestException('Co Owner missing information');
        }
        return;
      }

      if (!this.validateSigner(e)) {
        throw new BadRequestException(`${e.role} missing information`);
      }
    });

    value.contractDetail.signerDetails = value.contractDetail.signerDetails.filter(this.validateSigner);

    return value;
  }

  private validateSigner(signer: SignerDetailDto): boolean {
    return !!(signer.email && signer.roleId && signer.fullName);
  }
}
