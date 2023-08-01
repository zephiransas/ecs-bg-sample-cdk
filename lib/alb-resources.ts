import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Construct } from 'constructs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { EcsResources } from './ecs-resources';
import { Duration } from 'aws-cdk-lib';
import { nameOf } from './utils';

export class AlbResources {

  readonly productionlistener: elb.ApplicationListener
  readonly testlistener: elb.ApplicationListener
  readonly blueTarget: elb.ApplicationTargetGroup
  readonly greenTarget: elb.ApplicationTargetGroup

  constructor(scope: Construct, vpc: IVpc, ecsResources: EcsResources) {
  
    const alb = new elb.ApplicationLoadBalancer(scope, nameOf(scope, "alb"), {
      vpc: vpc,
      internetFacing: true,
    });
  
    this.blueTarget = new elb.ApplicationTargetGroup(scope, nameOf(scope, "target-blue"), {
      vpc: vpc,
      protocol: elb.ApplicationProtocol.HTTP,
      targetType: elb.TargetType.IP,
      healthCheck: {
        path: "/hello",
        port: "9000",
        interval: Duration.seconds(10),
        healthyThresholdCount: 10,
        timeout: Duration.seconds(5)
      },
    })

    this.greenTarget = new elb.ApplicationTargetGroup(scope, nameOf(scope, "target-green"), {
      vpc: vpc,
      protocol: elb.ApplicationProtocol.HTTP,
      targetType: elb.TargetType.IP,
      healthCheck: {
        path: "/hello",
        port: "9000",
        interval: Duration.seconds(10),
        healthyThresholdCount: 10,
        timeout: Duration.seconds(5)
      },
    })

    this.productionlistener = alb.addListener(nameOf(scope, "production-listener"), {
      protocol: elb.ApplicationProtocol.HTTP,
      port: 80,
      defaultTargetGroups: [this.blueTarget]
    });

    this.testlistener = alb.addListener(nameOf(scope, "test-listener"), {
      protocol: elb.ApplicationProtocol.HTTP,
      port: 9000,
      defaultTargetGroups: [this.blueTarget]
    });

  }
}