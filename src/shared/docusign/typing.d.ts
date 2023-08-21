import { IDocusignCompositeContract } from 'src/docusign-communications/typing';

export interface ISendContractProps {
  contractId: string;
  pageFrom: string;
  isDraft: boolean;
  createContractPayload: IDocusignCompositeContract;
}
