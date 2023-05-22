import { App, Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, Secret as sec  } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Certificate, CertificateValidation }from 'aws-cdk-lib/aws-certificatemanager';
import { Role } from 'aws-cdk-lib/aws-iam';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';


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

  // 👇 Importing AWS Secret using Name
  const secret = Secret.fromSecretNameV2(this, 'SecretFromName', `${company}-${applicationId}-${processId}-${environment}-env-vars`)


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

  const loadBalancer = new ApplicationLoadBalancer(this, 'ECSLB', {
    loadBalancerName: `${company}-${applicationId}-${processId}-${environment}`,
    vpc,
    internetFacing: true,
      vpcSubnets: {
        subnets: Fn.split(
          ',', `${publicSubnetsIds}`,3).map((subnetId, i) => Subnet.fromSubnetId(this, `subnet${i}`, subnetId))
      }
   })

  // 👇 Deploy fargate to ECS
  const loadBalancedFargateService = new ApplicationLoadBalancedFargateService(this, 'Service', {
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
      executionRole: Role.fromRoleName(this, 'exec-role', `${company}-${applicationId}-${processId}-${environment}-ecs-task-execution`),
      secrets:{
        AWS_S3_ARRAY_HOURLY_PRODUCTION: sec.fromSecretsManager(secret, 'AWS_S3_ARRAY_HOURLY_PRODUCTION'),
        AWS_S3_BUCKET: sec.fromSecretsManager(secret, 'AWS_S3_BUCKET'),
        AWS_S3_PINBALL_SIMULATION: sec.fromSecretsManager(secret, 'AWS_S3_PINBALL_SIMULATION'),
        AWS_S3_UTILITY_DATA: sec.fromSecretsManager(secret, 'AWS_S3_UTILITY_DATA'),
        DOCUSIGN_ENV: sec.fromSecretsManager(secret, 'DOCUSIGN_ENV'),
        DOCUSIGN_SECRET_NAME: sec.fromSecretsManager(secret, 'DOCUSIGN_SECRET_NAME'),
        FNI_END_POINT: sec.fromSecretsManager(secret, 'FNI_END_POINT'),
        FNI_SECRET_MANAGER_NAME: sec.fromSecretsManager(secret, 'FNI_SECRET_MANAGER_NAME'),
        GENABILITY_APP_ID: sec.fromSecretsManager(secret, 'GENABILITY_APP_ID'),
        GENABILITY_APP_KEY: sec.fromSecretsManager(secret, 'GENABILITY_APP_KEY'),
        GOOGLE_SUNROOF_API_KEY: sec.fromSecretsManager(secret, 'GOOGLE_SUNROOF_API_KEY'),
        GOOGLE_SUNROOF_S3_BUCKET: sec.fromSecretsManager(secret, 'GOOGLE_SUNROOF_S3_BUCKET'),
        JWT_EXPIRE_TIME: sec.fromSecretsManager(secret, 'JWT_EXPIRE_TIME'),
        JWT_SECRET: sec.fromSecretsManager(secret, 'JWT_SECRET'),
        MAILGUN_DOMAIN: sec.fromSecretsManager(secret, 'MAILGUN_DOMAIN'),
        MAILGUN_KEY: sec.fromSecretsManager(secret, 'MAILGUN_KEY'),
        MAILGUN_SENDER_EMAIL: sec.fromSecretsManager(secret, 'MAILGUN_SENDER_EMAIL'),
        MONGO_URL: sec.fromSecretsManager(secret, 'MONGO_URL'),
        NODE_OPTIONS: sec.fromSecretsManager(secret, 'NODE_OPTIONS'),
        PROPOSAL_AWS_BUCKET: sec.fromSecretsManager(secret, 'PROPOSAL_AWS_BUCKET'),
        PROPOSAL_AWS_REGION: sec.fromSecretsManager(secret, 'PROPOSAL_AWS_REGION'),
        PROPOSAL_JWT_SECRET: sec.fromSecretsManager(secret, 'PROPOSAL_JWT_SECRET'),
        PROPOSAL_URL: sec.fromSecretsManager(secret, 'PROPOSAL_URL'),
        QUALIFICATION_JWT_SECRET: sec.fromSecretsManager(secret, 'QUALIFICATION_JWT_SECRET'),
        QUALIFICATION_PAGE: sec.fromSecretsManager(secret, 'QUALIFICATION_PAGE'),
        SOLAR_QUOTING_TOOL_INTEGRATION: sec.fromSecretsManager(secret, 'SOLAR_QUOTING_TOOL_INTEGRATION'),
        SUPPORT_MAIL: sec.fromSecretsManager(secret, 'SUPPORT_MAIL'),
      }
    }   
  });

  // 👇 Target group helth check configurations
  loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/api/healthcheck",
      healthyHttpCodes: '200',
      });
  }
}