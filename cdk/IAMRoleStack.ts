import { aws_iam as iam } from 'aws-cdk-lib';
import { App, Stack, StackProps } from 'aws-cdk-lib';


const {
  SWL_APPLICATION_ID: applicationId,
  SWL_COMPANY: company,
  SWL_ENVIRONMENT: environment,
  SWL_PROCESS_ID: processId,
} = process.env

export class IAMRoleStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
  super(scope, id, props);

  // 👇 Task execution role creation  
  const execRole = new iam.Role(this, 'TaskExecutionRole', {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    roleName: `${company}-${applicationId}-${processId}-${environment}-ecs-task-execution`,
  })
  execRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'))
  }
}