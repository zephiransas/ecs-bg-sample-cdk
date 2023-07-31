import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Construct } from 'constructs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { EcsResources } from './ecs-resources';
import { Duration } from 'aws-cdk-lib';

export class AlbResources {

  readonly productionlistener: elb.ApplicationListener
  readonly testlistener: elb.ApplicationListener
  readonly blueTarget: elb.ApplicationTargetGroup
  readonly greenTarget: elb.ApplicationTargetGroup

  constructor(scope: Construct, vpc: IVpc, ecsResources: EcsResources) {
  
    const alb = new elb.ApplicationLoadBalancer(scope, 'sample20230729-alb', {
      vpc: vpc,
      internetFacing: true,
    });
  
    this.productionlistener = alb.addListener('sample20230729-production-listener', {
      protocol: elb.ApplicationProtocol.HTTP,
      port: 80
    });
  
    this.testlistener = alb.addListener('sample20230729-test-listener', {
      protocol: elb.ApplicationProtocol.HTTP,
      port: 9000,
    });
  
    this.blueTarget = this.productionlistener.addTargets('sample20230729-target-blue', {
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

    this.greenTarget = this.testlistener.addTargets('sample20230729-target-green', {
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

  }
}