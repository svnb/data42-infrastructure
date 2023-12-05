import * as pulumi from "@pulumi/pulumi";
import { CloudProvider, OpenMetadata } from "./src";
import { K8sCluster } from "./src/k8s";

interface InfrastructureArgs {
  openmetadata: {
    namespace: string;
  };
}

const config = new pulumi.Config();
const cloudProvider = config.require<CloudProvider>("cloudProvider");

const k8sCluster = new K8sCluster("data42", {
  cloudProvider,
});

new OpenMetadata("openmetadata", {
  name: "openmetadata",
  k8sProvider: k8sCluster.provider,
});
