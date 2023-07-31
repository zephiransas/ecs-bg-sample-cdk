import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { IRepository } from 'aws-cdk-lib/aws-ecr';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';

export class EcsResources {

  readonly ecsService: ecs.FargateService

  constructor(scope: Construct, vpc: IVpc, repo: IRepository, logGroup: ILogGroup) {

    // Cluster
    const cluster = new ecs.Cluster(scope, "sample20230729-ecs-cluster", {
      clusterName: "sample20230729-ecs-cluster",
      vpc: vpc
    });

    // TaskDefinition
    const taskDefinition = new ecs.FargateTaskDefinition(scope, "sample20230729-task-def", {
      memoryLimitMiB: 2048,
      cpu: 1024
    });

    taskDefinition.addContainer("app", {
      image: ecs.ContainerImage.fromEcrRepository(repo, "latest"),
      memoryLimitMiB: 2048,
      portMappings: [
        {
          containerPort: 9000,
          hostPort: 9000
        }
      ],
      logging: ecs.LogDriver.awsLogs({
        logGroup: logGroup,
        streamPrefix: "app"
      }),
    })

    // Service
    this.ecsService = new ecs.FargateService(scope, "sample20230729-service", {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 0,
      assignPublicIp: true,
      deploymentController: { 
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
      vpcSubnets: vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC })
    });
    
  }
}