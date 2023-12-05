import * as pulumi from "@pulumi/pulumi";
import * as snowflake from "@pulumi/snowflake";
import * as random from "@pulumi/random";
import * as k8s from "@pulumi/kubernetes";
import { OpenMetadataSnowflake } from "./snowflake";

const CHARTS_PATH = "./charts";

interface OpenMetadataK8sArgs {
  namespace: string;
  snowflake: OpenMetadataSnowflake;
  provider: k8s.Provider;
}

export class OpenmetadataK8s extends pulumi.ComponentResource {
  namespace: k8s.core.v1.Namespace;
  chart: k8s.helm.v3.Chart;

  constructor(
    name: string,
    args: OpenMetadataK8sArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:OpenMetadataK8s", name, opts);

    // Kubernetes Resources
    this.namespace = new k8s.core.v1.Namespace(
      "namespace",
      {
        metadata: {
          name: args.namespace,
        },
      },
      { parent: this, provider: args.provider }
    );

    const mysqlPassword = new random.RandomPassword(
      "mysql",
      { length: 16 },
      { parent: this }
    );
    const mysqlSecret = new k8s.core.v1.Secret(
      "mysql",
      {
        type: "Opaque",
        metadata: {
          name: "mysql-secrets",
          namespace: this.namespace.metadata.name,
        },
        stringData: {
          "openmetadata-mysql-password": mysqlPassword.result,
        },
      },
      { parent: this, provider: args.provider }
    );

    const airflowPassword = new random.RandomPassword(
      "airflow",
      {
        length: 16,
      },
      { parent: this }
    );
    const airflowSecret = new k8s.core.v1.Secret(
      "airflow",
      {
        type: "Opaque",
        metadata: {
          name: "airflow-secrets",
          namespace: this.namespace.metadata.name,
        },
        stringData: {
          "openmetadata-airflow-password": airflowPassword.result,
        },
      },
      { parent: this, provider: args.provider }
    );

    const airflowMysqlPassword = new random.RandomPassword(
      "airflow-mysql",
      {
        length: 16,
      },
      { parent: this }
    );
    const airflowMysqlSecret = new k8s.core.v1.Secret(
      "airflow-mysql",
      {
        type: "Opaque",
        metadata: {
          name: "airflow-mysql-secrets",
          namespace: this.namespace.metadata.name,
        },
        stringData: {
          "openmetadata-airflow-mysql-password": airflowMysqlPassword.result,
        },
      },
      { parent: this, provider: args.provider }
    );

    new k8s.core.v1.Secret(
      "snowflake",
      {
        type: "Opaque",
        metadata: {
          name: "snowflake",
          namespace: this.namespace.metadata.name,
        },
        stringData: {
          account: snowflake.config.account!,
          username: args.snowflake.user.name,
          password: args.snowflake.user.password.apply((v) => v!),
          warehouse: args.snowflake.warehouse.name,
          role: args.snowflake.role.name,
        },
      },
      { parent: this, provider: args.provider }
    );

    const deps = new k8s.helm.v3.Chart(
      "openmetadata-dependencies",
      {
        namespace: this.namespace.metadata.name,
        path: CHARTS_PATH,
        chart: "openmetadata-dependencies",
      },
      {
        parent: this,
        provider: args.provider,
      }
    );

    this.chart = new k8s.helm.v3.Chart(
      "openmetadata",
      {
        namespace: this.namespace.metadata.name,
        path: CHARTS_PATH,
        chart: "openmetadata",
      },
      {
        parent: this,
        provider: args.provider,
        dependsOn: [deps],
      }
    );

    this.registerOutputs({
      chart: this.chart,
    });
  }
}
