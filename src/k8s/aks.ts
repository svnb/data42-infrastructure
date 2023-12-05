import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as tls from "@pulumi/tls";
import { K8sCloudCluster, K8sCloudClusterArgs } from ".";

export class AKS extends pulumi.ComponentResource implements K8sCloudCluster {
  readonly cluster: azure.containerservice.ManagedCluster;
  readonly kubeconfig: pulumi.Output<string>;

  constructor(
    name: string,
    args: K8sCloudClusterArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:AKS", name, opts);

    const resourceGroup = new azure.resources.ResourceGroup(
      name,
      {
        resourceGroupName: name,
      },
      { parent: this }
    );

    const sshKey = new tls.PrivateKey(
      "ssh-key",
      {
        algorithm: "RSA",
        rsaBits: 4096,
      },
      { parent: this }
    );

    const identity = new azure.managedidentity.UserAssignedIdentity(
      "identity",
      { resourceGroupName: resourceGroup.name, resourceName: "aks-identity" },
      { parent: this }
    );

    this.cluster = new azure.containerservice.ManagedCluster(
      args.clusterName,
      {
        resourceName: args.clusterName,
        resourceGroupName: resourceGroup.name,
        agentPoolProfiles: [
          {
            count: 1,
            maxPods: 110,
            mode: "System",
            name: "agentpool",
            nodeLabels: {},
            osDiskSizeGB: 30,
            osType: "Linux",
            type: "VirtualMachineScaleSets",
            vmSize: "Standard_DS2_v2",
          },
        ],
        enableRBAC: true,
        dnsPrefix: resourceGroup.name,
        kubernetesVersion: args.version,
        identity: {
          type: azure.containerservice.ResourceIdentityType.UserAssigned,
          userAssignedIdentities: [identity.id],
        },
        linuxProfile: {
          adminUsername: "aksuser",
          ssh: {
            publicKeys: [
              {
                keyData: sshKey.publicKeyOpenssh,
              },
            ],
          },
        },
      },
      { parent: this }
    );

    const assignment = new azure.authorization.RoleAssignment(
      "roleAssignment",
      {
        principalId: identity.principalId,
        principalType: "ServicePrincipal",
        roleDefinitionId:
          "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c", // Contributor
        scope: resourceGroup.id,
      },
      { parent: this }
    );

    const creds =
      azure.containerservice.listManagedClusterUserCredentialsOutput(
        {
          resourceGroupName: resourceGroup.name,
          resourceName: this.cluster.name,
        },
        { parent: this }
      );

    this.kubeconfig = pulumi.secret(
      creds.kubeconfigs[0].value.apply((enc) =>
        Buffer.from(enc, "base64").toString()
      )
    );

    this.registerOutputs({
      sshKey,
      identity,
      cluster: this.cluster,
      kubeconfig: this.kubeconfig,
      assignment,
      creds,
    });
  }
}
