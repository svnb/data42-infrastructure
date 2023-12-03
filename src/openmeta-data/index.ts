import * as pulumi from "@pulumi/pulumi";
import { OpenMetadataSnowflake } from "./snowflake";
import { OpenmetadataK8s } from "./k8s";

interface OpenMetadataArgs {
  name: string;
}

export class OpenMetedata extends pulumi.ComponentResource {
  snowflake: OpenMetadataSnowflake;
  k8s: OpenmetadataK8s;

  constructor(
    name: string,
    args: OpenMetadataArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:OpenMetadata", name, opts);

    this.snowflake = new OpenMetadataSnowflake("snowflake", {
      name: args.name,
    });
    this.k8s = new OpenmetadataK8s("k8s", {
      namespace: args.name,
      snowflake: this.snowflake,
    });

    this.registerOutputs({
      snowflake: this.snowflake,
      k8s: this.k8s,
    });
  }
}
