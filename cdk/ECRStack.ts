import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { RemovalPolicy } from "aws-cdk-lib";
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { aws_iam as iam } from 'aws-cdk-lib';


const {
  AWS_ACCOUNT_ID: accountId,
  SWL_APPLICATION_ID: applicationId,
  SWL_COMPANY: company,
  SWL_ENVIRONMENT: environment,
  SWL_PROCESS_ID: processId,
} = process.env


export class ECRStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // 👇 ECR repository creation
    const repo = new Repository(this, 'ecr-repository', {
      repositoryName: `${company}-${applicationId}-${processId}-${environment}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

  const policy = new iam.PolicyStatement()
  policy.addPrincipals(new iam.ArnPrincipal(`arn:aws:iam::${accountId}:role/${company}-${applicationId}-${processId}-${environment}-ecs-task-execution`))
  policy.addActions(
    "ecr:BatchGetImage",
    "ecr:BatchCheckLayerAvailability",
    "ecr:CompleteLayerUpload",
    "ecr:GetDownloadUrlForLayer",
    "ecr:InitiateLayerUpload",
    "ecr:PutImage",
    "ecr:UploadLayerPart"
  )
  
  repo.addToResourcePolicy(policy)

  // 👇 Create an output object which defines ecr repo name which is deployed
  new CfnOutput(this, "ECRRepo", {
    value: repo.repositoryName,
    exportName: 'repo-name',
  })

}
}