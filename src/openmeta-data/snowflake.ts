import * as pulumi from "@pulumi/pulumi";
import * as snowflake from "@pulumi/snowflake";
import * as random from "@pulumi/random";
import * as k8s from "@pulumi/kubernetes";

interface OpenmetadataSnowflakeArgs {
  name: string;
}

export class OpenMetadataSnowflake extends pulumi.ComponentResource {
  user: snowflake.User;
  role: snowflake.Role;
  warehouse: snowflake.Warehouse;

  constructor(
    name: string,
    args: OpenmetadataSnowflakeArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:DatahubSnowflake", name, opts);

    this.role = new snowflake.Role("role", {
      name: args.name.toUpperCase(),
    });

    new snowflake.RoleGrants("role->deployment", {
      roleName: this.role.name,
      roles: ["DEPLOYMENT"],
    });

    this.warehouse = new snowflake.Warehouse("warehouse", {
      name: args.name.toUpperCase(),
    });

    new snowflake.GrantPrivilegesToRole("wh-usage", {
      roleName: this.role.name,
      privileges: ["OPERATE", "USAGE"],
      onAccountObject: {
        objectType: "WAREHOUSE",
        objectName: this.warehouse.name,
      },
    });

    const password = new random.RandomPassword("snowflake-password", {
      length: 16,
    });
    
    this.user = new snowflake.User("user", {
      name: args.name.toUpperCase(),
      defaultRole: this.role.name,
      defaultWarehouse: this.warehouse.name,
      password: password.result,
    });

    this.registerOutputs({
      user: this.user,
      role: this.role,
      warehouse: this.warehouse,
    });
  }
}
