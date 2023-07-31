import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as log from 'aws-cdk-lib/aws-logs';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { Construct } from 'constructs';
import { EcsResources } from './ecs-resources';
import { Duration } from 'aws-cdk-lib';

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
    const alb = new elb.ApplicationLoadBalancer(this, 'sample20230729-alb', {
      vpc: vpc,
      internetFacing: true,
    });

    const productionlistener = alb.addListener('sample20230729-production-listener', {
      protocol: elb.ApplicationProtocol.HTTP,
      port: 80
    });

    const testlistener = alb.addListener('sample20230729-test-listener', {
      protocol: elb.ApplicationProtocol.HTTP,
      port: 9000,
    });

    const blueTarget = productionlistener.addTargets('sample20230729-target-blue', {
      healthCheck: {
        path: "/hello",
        port: "9000",
        interval: Duration.seconds(10),
        healthyThresholdCount: 10,
        timeout: Duration.seconds(5)
      },
      protocol: elb.ApplicationProtocol.HTTP,
      targets: [ecsResources.ecsService]
    });

    const greenTarget = testlistener.addTargets('sample20230729-target-green', {
      healthCheck: {
        path: "/hello",
        port: "9000",
        interval: Duration.seconds(10),
        healthyThresholdCount: 10,
        timeout: Duration.seconds(5)
      },
      protocol: elb.ApplicationProtocol.HTTP,
      targets: [ecsResources.ecsService]
    });

    const app = new codedeploy.EcsApplication(this, "sample20230729-app", {
      applicationName: "sample20230729-app"
    })

    new codedeploy.EcsDeploymentGroup(this, "group", {
      application: app,
      service: ecsResources.ecsService,
      blueGreenDeploymentConfig: {
        blueTargetGroup: blueTarget,
        greenTargetGroup: greenTarget,
        listener: productionlistener,
        testListener: testlistener,
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
