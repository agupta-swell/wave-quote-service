import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {App, Stack, StackProps, CfnOutput} from 'aws-cdk-lib';

const {
  AWS_REGION: region,
  AWS_ACCOUNT_ID: accountId,
  SWL_APPLICATION_ID: applicationId,
  SWL_COMPANY: company,
  SWL_ENVIRONMENT: environment,
  SWL_PROCESS_ID: processId,
} = process.env

export class IAMRoleStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
  super(scope, id, props);

  // 👇 Task execution role creation  
  const execRole = new Role(this, 'TaskExecutionRole', {
    assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    roleName: `${company}-${applicationId}-${processId}-${environment}-ecs-task-execution`,
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')],
  }).addToPolicy(new PolicyStatement({actions: [
        "secretsmanager:GetSecretValue"
      ],
        resources: [
          `arn:aws:secretsmanager:${region}:${accountId}:secret:${company}-${applicationId}-${processId}-${environment}-env-vars:*`
        ]
      }
      ))
  }
}