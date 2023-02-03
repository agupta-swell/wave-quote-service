import { ExposeProp } from 'src/shared/decorators';

export class UpdateOpportunityTitleNameMatchDto {
  @ExposeProp()
  alternateTitleDocumentationSubmitted: boolean;

  @ExposeProp()
  alternateTitleDocumentationSubmitDate: Date;

  @ExposeProp()
  alternateTitleDocumentationName: string;

  @ExposeProp()
  alternateTitleDocumentationAddress: string;

  @ExposeProp()
  applicantNameMatchesTitle: boolean;

  @ExposeProp()
  coapplicantNameMatchesTitle: boolean;
}
