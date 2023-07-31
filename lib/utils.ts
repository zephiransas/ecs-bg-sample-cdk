import { IConstruct } from "constructs";

export interface Context {
    readonly accountId: string
    readonly region: string
    readonly env: string
    readonly vpcId: string
    readonly repositoryName: string
}

export const nameOf = (scope: IConstruct, value: string) => `ecs-bg-sample-${getContext(scope).env}-${value}`

export const getContext = (scope: IConstruct): Context => {
    const env = scope.node.tryGetContext("env")
    return scope.node.tryGetContext(env)
}