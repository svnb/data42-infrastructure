import * as pulumi from "@pulumi/pulumi";
import { DatahubSnowflakeComponent } from "./snowflake";
import { DatahubK8sComponent } from "./k8s";

interface DatahubArgs {
  name: string;
}

export class Datahub extends pulumi.ComponentResource {
  snowflake: DatahubSnowflakeComponent;
  k8s: DatahubK8sComponent;

  constructor(
    name: string,
    args: DatahubArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:Datahub", name, opts);

    this.snowflake = new DatahubSnowflakeComponent("snowflake", {
      name: args.name,
    });
    this.k8s = new DatahubK8sComponent("k8s", {
      namespace: args.name,
      snowflake: this.snowflake,
    });

    this.registerOutputs({
      snowflake: this.snowflake,
      k8s: this.k8s,
    });
  }
}
