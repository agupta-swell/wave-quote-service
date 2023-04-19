import { App } from 'aws-cdk-lib';
import { ECRStack } from './ECRStack';
import { ECSStack } from './ECSStack';
import { IAMRoleStack } from './IAMRoleStack';

const {
  AWS_REGION: region,
  AWS_ACCOUNT_ID: accountId,
  AWS_TOOLS_ACCOUNT_ID: toolsAccountId,
  AWS_ECR_REGION: ecrRegion,
  SWL_APPLICATION_ID: applicationId,
  SWL_ASSET_CLASS: assetClass,
  SWL_ASSOCIATED_APPLICATION_ID: associatedApplicationId,
  SWL_BUSINESS_OWNER: businessOwner,
  SWL_COMPANY: company,
  SWL_COST_CENTER: costCenter,
  SWL_DATA_CLASSIFICATION: dataClassification,
  SWL_ENVIRONMENT: environment,
  SWL_PROCESS_ID: processId,
  SWL_REQUESTED_BY: requestedBy,
  SWL_TECHNICAL_OWNER: technicalOwner,
  SWL_TIER: tier,
} = process.env
  
const tags = {
  'swl:application-id': applicationId!,
  'swl:asset-class': assetClass!,
  'swl:business-owner': businessOwner!,
  'swl:company': company!,
  'swl:cost-center': costCenter!,
  'swl:data-classification': dataClassification!,
  'swl:environment': environment!,
  'swl:process-id': processId!,
  'swl:requested-by': requestedBy!,
  'swl:technical-owner': technicalOwner!,
  'swl:tier': tier!,
}

const app = new App();

const deploymentEnv  = { account: `${accountId}`, region: `${region}` };
const toolsEnv  = { account: `${toolsAccountId}`, region: `${ecrRegion}` };

new IAMRoleStack(app, 'IAMRoleStack', {
  env: deploymentEnv,
  stackName: `${company}-${applicationId}-${processId}-${environment}-iamrole`,
  tags: tags,
});

new ECRStack(app, 'ECRStack', {
  env: toolsEnv,
  stackName: `${company}-${applicationId}-${processId}-${environment}-ecr`,
  tags: tags,
});

new ECSStack(app, 'ECSStack', {
  env: deploymentEnv,
  stackName: `${company}-${applicationId}-${processId}-${environment}-ecs`,
  tags: tags,
});


