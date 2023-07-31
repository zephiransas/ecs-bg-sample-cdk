import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as log from 'aws-cdk-lib/aws-logs';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { Construct } from 'constructs';
import { EcsResources } from './ecs-resources';
import { AlbResources } from './alb-resources';
import { getContext, nameOf } from './utils';

export class EcsBgSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ctx = getContext(scope)

    const vpc = ec2.Vpc.fromLookup(this, "vpc", {vpcId: ctx.vpcId});

    const repo = ecr.Repository.fromRepositoryName(this, ctx.repositoryName, ctx.repositoryName);

    const logGroup = new log.LogGroup(this, nameOf(scope, "ecs-logs"), {
      logGroupName: nameOf(scope, "ecs-logs"),
      removalPolicy: cdk.RemovalPolicy.DESTROY,   //本番運用時には変えること
    });

    // ECS
    const ecsResources = new EcsResources(this, vpc, repo, logGroup)

    // ALB
    const albResources = new AlbResources(this, vpc, ecsResources)

    // CodeDeploy
    const app = new codedeploy.EcsApplication(this, nameOf(scope, "cd-application"), {
      applicationName: nameOf(scope, "cd-application")
    })

    new codedeploy.EcsDeploymentGroup(this, nameOf(scope, "deployment-group"), {
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
