import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { OpenMetadataSnowflake } from "./snowflake";
import { OpenmetadataK8s } from "./k8s";

interface OpenMetadataArgs {
  name: string;
  k8sProvider: k8s.Provider;
}

export class OpenMetadata extends pulumi.ComponentResource {
  snowflake: OpenMetadataSnowflake;

  constructor(
    name: string,
    args: OpenMetadataArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:OpenMetadata", name, opts);

    this.snowflake = new OpenMetadataSnowflake(
      "snowflake",
      {
        name: args.name,
      },
      { parent: this }
    );
    new OpenmetadataK8s(
      "k8s",
      {
        namespace: args.name,
        snowflake: this.snowflake,
        provider: args.k8sProvider,
      },
      { parent: this }
    );

    this.registerOutputs({
      snowflake: this.snowflake,
    });
  }
}
