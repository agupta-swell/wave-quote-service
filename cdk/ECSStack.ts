import { App, Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { aws_elasticloadbalancingv2, aws_ecs_patterns } from 'aws-cdk-lib';
import { Certificate, CertificateValidation }from 'aws-cdk-lib/aws-certificatemanager';
import { aws_iam as iam } from 'aws-cdk-lib';
import { HostedZone } from 'aws-cdk-lib/aws-route53';

const {
  AWS_VPC: vpcId,
  AWS_PRIVATE_SUBNETS: privateSubnetsIds,
  AWS_PUBLIC_SUBNETS: publicSubnetsIds,
  AWS_DOMAIN_NAME: domainName,
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
  const vpc = Vpc.fromLookup(this, 'vpc', {
    vpcId,
  })

  // 👇 Importing existing hosted zone in route53 using lookup function
  const zone = HostedZone.fromLookup(this, 'Zone', { domainName: `${domainName}` });

  // 👇 ECS cluster creation
  const cluster = new Cluster(this, "Cluster", {
    clusterName: `${company}-${applicationId}-${processId}-${environment}`,
    vpc,
  })

  // Domain name for ECS App
  const domain = `${processId}.${environment}.${domainName}`
  
  // 👇 SSL certificate creation
  const mycertificate = new Certificate(this, 'SubSubDomainsCertificate', {
    domainName: `${domain}`,
    validation: CertificateValidation.fromDns(zone)
  });

  const loadBalancer = new aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, 'ECSLB', {
    loadBalancerName: `${company}-${applicationId}-${processId}-${environment}`,
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
    serviceName: `${company}-${applicationId}-${processId}-${environment}`,
    loadBalancer,
    domainName: domain,
    domainZone: zone,
    certificate: mycertificate,
    redirectHTTP: true,
    memoryLimitMiB: parseInt(memory_spec ?? "512"),
    cpu: parseInt(cpu_spec ?? "256"),
    taskImageOptions: {
      image: ContainerImage.fromRegistry(`${toolsAccountId}.dkr.ecr.${ecrRegion}.amazonaws.com/${company}-${applicationId}-${processId}-${environment}:${imagetag}`),
      containerPort: 3000,
      containerName: 'app',
      executionRole: iam.Role.fromRoleName(this, 'exec-role', `${company}-${applicationId}-${processId}-${environment}-ecs-task-execution`),
    }   
  });

  // 👇 Target group helth check configurations
  loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/api/healthcheck",
      healthyHttpCodes: '200',
      });
  }
}