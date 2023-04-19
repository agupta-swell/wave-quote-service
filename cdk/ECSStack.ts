import { App, Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AwsLogDriver, Cluster, ContainerImage, FargateTaskDefinition, Protocol } from 'aws-cdk-lib/aws-ecs';
import { aws_elasticloadbalancingv2, aws_ecs_patterns } from 'aws-cdk-lib';
import { Certificate, CertificateValidation }from 'aws-cdk-lib/aws-certificatemanager';
import { aws_iam as iam } from 'aws-cdk-lib';
import { HostedZone } from 'aws-cdk-lib/aws-route53';


const {
  AWS_VPC: vpcId,
  AWS_PRIVATE_SUBNETS: privateSubnetsIds,
  AWS_PUBLIC_SUBNETS: publicSubnetsIds,
  AWS_TOOLS_ACCOUNT_ID: toolsAccountId,
  AWS_NETWORKING_STACK: awsNetworkingStack,
  AWS_ECR_REGION: ecrRegion,
  SWL_APPLICATION_ID: applicationId,
  SWL_COMPANY: company,
  SWL_ENVIRONMENT: environment,
  SWL_PROCESS_ID: processId,
  IMAGE_TAG: imagetag,
  CPU_SPEC: cpu_spec,
  MEMORY_SPEC: memory_spec,
} = process.env

export class ECSStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
  super(scope, id, props);

  // 👇 Importing existing VPC and Public/Private Subnets using Import function
  const vpc = Vpc.fromLookup(this, 'myvpc', {
    vpcId,
  })


  // 👇 Importing existing hosted zone in route53 using lookup function
  const zone = HostedZone.fromLookup(this, 'Zone', { domainName: 'dev.wave.swellenergy.com' });
    
  // 👇 ECS cluster creation
  const cluster = new Cluster(this, "Cluster", {
    clusterName: `${company}-${applicationId}-${processId}-${environment}`,
    vpc,
  })

  // Domain name for ECS App
  const domain = `${processId}.${environment}.wave.swellenergy.com`
  
  // 👇 SSL certificate creation
  const mycertificate = new Certificate(this, 'SubSubDomainsCertificate', {
    domainName: `${domain}`,
    validation: CertificateValidation.fromDns(zone)
  });

  // 👇 Task Role creation
  const taskrole = new iam.Role(this, `ecs-taskrole-${this.stackName}`, {
    roleName: `${company}-${applicationId}-${processId}-${environment}-ecs-taskrole`,
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
  });
  
  // 👇 IAM policy creation for task role
  const executionRolePolicy =  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: ['*'],
    actions: [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  });

  
  // 👇 Task definition creation  
  const taskDef = new FargateTaskDefinition(this, "ecs-taskdef", {
    taskRole: taskrole,
    executionRole: iam.Role.fromRoleArn(this, 'Myrole', Fn.importValue(`${company}-${applicationId}-${processId}-${environment}-role-arn`)),
  });
  
  // 👇 Added execution policy to task definition    
  taskDef.addToExecutionRolePolicy(executionRolePolicy);
  
  // 👇 ECS logging enabling    
  const logging = new AwsLogDriver({
    streamPrefix: "ecs-logs"
  });

  // 👇 Adding container to Task definition
  const container = taskDef.addContainer('my-app', {
    image: ContainerImage.fromRegistry(`${toolsAccountId}.dkr.ecr.${ecrRegion}.amazonaws.com/${company}-${applicationId}-${processId}-${environment}:${imagetag}`),
    memoryLimitMiB: parseInt(memory_spec ?? "256"),
    cpu: parseInt(cpu_spec ?? "256"),
    logging,
  });

  container.addPortMappings({
    containerPort: 3001,
    protocol: Protocol.TCP
  });

  const loadBalancer = new aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, 'ECSLB', {
    loadBalancerName: `${company}-${applicationId}-${processId}`,
    vpc,
    internetFacing: true,
      vpcSubnets: {
        subnets: Fn.split(
          ',', `${publicSubnetsIds}`,3).map((subnetId, i) => Subnet.fromSubnetId(this, `subnet${i}`, subnetId))
      }
   })


  // 👇 Deploy fargate to ECS
  const loadBalancedFargateService = new aws_ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
    cluster,
    circuitBreaker: {
      rollback: true,
    },
    desiredCount: 1,
    taskSubnets: {
      subnets: Fn.split(
        ',', `${privateSubnetsIds}`,3).map((subnetId, i) => Subnet.fromSubnetId(this, `mysubnet${i}`, subnetId))
     },
    serviceName: `${company}-${applicationId}-${processId}`,
    loadBalancer,
    domainName: domain,
    domainZone: zone,
    certificate: mycertificate,
    redirectHTTP: true,
    taskDefinition: taskDef,    
  });

  // 👇 Target group helth check configurations
  loadBalancedFargateService.targetGroup.configureHealthCheck({
    path: "/api/healthcheck",
    healthyHttpCodes: '200',
  });

    }
}