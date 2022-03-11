import { Injectable, PipeTransform } from '@nestjs/common';
import { UsageProfileService } from 'src/usage-profiles/usage-profile.service';
import { CreateUtilityReqDto } from '../req';

@Injectable()
export class ValidateAndSnapshotUsageProfilePipe
  implements PipeTransform<CreateUtilityReqDto, Promise<CreateUtilityReqDto>> {
  constructor(private readonly usageProfileService: UsageProfileService) {}

  async transform(value: CreateUtilityReqDto): Promise<CreateUtilityReqDto> {
    const { usageProfileId } = value;

    if (!usageProfileId) {
      return value;
    }

    const usageProfile = await this.usageProfileService.getOne(usageProfileId);

    return UsageProfileService.Snapshot(value, usageProfile);
  }
}
