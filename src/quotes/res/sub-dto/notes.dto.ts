import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class NotesDto {
  @ExposeProp()
  id: string;

  @ExposeProp()
  text: string;

  @ExposeProp()
  showOnProposal: boolean;

  @ExposeProp()
  showOnContract: boolean;

  @ExposeProp()
  isApproved: boolean;

  @ExposeProp()
  approvalComment: string;

  @ExposeProp()
  approvedBy: string;

  @ExposeProp()
  approvedAt: Date | null;
}
