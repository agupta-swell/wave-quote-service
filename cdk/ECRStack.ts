import { App, Stack, StackProps } from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { ArnPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';


const {
  AWS_ACCOUNT_ID: accountId,
  SWL_APPLICATION_ID: applicationId,
  SWL_COMPANY: company,
  SWL_ENVIRONMENT: environment,
  SWL_PROCESS_ID: processId,
} = process.env


export class ECRStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    // 👇 ECR repository creation
    const repo = new Repository(this, 'ecr-repository', {
      repositoryName: `${company}-${applicationId}-${processId}-${environment}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const policy = new PolicyStatement()
    policy.addPrincipals(new ArnPrincipal(`arn:aws:iam::${accountId}:role/${company}-${applicationId}-${processId}-${environment}-ecs-task-execution`))
    policy.addActions(
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
    )        
    repo.addToResourcePolicy(policy)
}
}