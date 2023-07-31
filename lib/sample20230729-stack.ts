import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as log from 'aws-cdk-lib/aws-logs';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { Construct } from 'constructs';
import { EcsResources } from './ecs-resources';
import { AlbResources } from './alb-resources';

export class Sample20230729Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "vpc", {vpcId: "vpc-0309270ee4fd6e6b7"});

    const repo = ecr.Repository.fromRepositoryName(this, "sample", "sample");

    const logGroup = new log.LogGroup(this, "sample20230729-ecs-log", {
      logGroupName: "sample20230729-ecs-log"
    });

    // ECS
    const ecsResources = new EcsResources(this, vpc, repo, logGroup)

    // ALB
    const albResources = new AlbResources(this, vpc, ecsResources)

    // CodeDeploy
    const app = new codedeploy.EcsApplication(this, "sample20230729-app", {
      applicationName: "sample20230729-app"
    })

    new codedeploy.EcsDeploymentGroup(this, "group", {
      application: app,
      service: ecsResources.ecsService,
      blueGreenDeploymentConfig: {
        blueTargetGroup: albResources.blueTarget,
        greenTargetGroup: albResources.greenTarget,
        listener: albResources.productionlistener,
        testListener: albResources.testlistener,
        deploymentApprovalWaitTime: cdk.Duration.minutes(10),
        terminationWaitTime: cdk.Duration.minutes(20),
      },
      autoRollback: {
        failedDeployment: true
      },
      deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE
    })

  }
}
