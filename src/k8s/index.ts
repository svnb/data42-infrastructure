import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { AKS } from "./aks";
import { CloudProvider } from "../types";

export interface K8sClusterArgs {
  cloudProvider: CloudProvider;
}

export interface K8sCloudClusterArgs extends K8sCloudClusterConfig {} // Empty for now, additional args possible in the future

export interface K8sCloudClusterConfig {
  clusterName: string;
  version: string;
}

export interface K8sCloudCluster {
  kubeconfig: pulumi.Output<string>;
}

export class K8sCluster extends pulumi.ComponentResource {
  readonly provider: k8s.Provider;

  constructor(
    name: string,
    args: K8sClusterArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:K8sCluster", name, opts);
    const config = new pulumi.Config().requireObject<K8sCloudClusterConfig>(
      "k8s"
    );

    let cluster: K8sCloudCluster;
    switch (args.cloudProvider) {
      case CloudProvider.AZURE: {
        cluster = new AKS(
          "data42-aks",
          {
            version: config.version,
            clusterName: config.clusterName || "data42-aks",
          },
          { parent: this }
        );
        break;
      }
      default:
        throw new Error(`Provider ${args.cloudProvider} not implemented`);
    }

    this.provider = new k8s.Provider(
      "aks",
      {
        kubeconfig: cluster.kubeconfig,
      },
      { parent: this }
    );

    this.registerOutputs();
  }
}
