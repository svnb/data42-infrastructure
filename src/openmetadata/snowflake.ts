import * as pulumi from "@pulumi/pulumi";
import * as snowflake from "@pulumi/snowflake";
import * as random from "@pulumi/random";

interface OpenMetadataSnowflakeArgs {
  name: string;
}

export class OpenMetadataSnowflake extends pulumi.ComponentResource {
  user: snowflake.User;
  role: snowflake.Role;
  warehouse: snowflake.Warehouse;

  constructor(
    name: string,
    args: OpenMetadataSnowflakeArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("pkg:index:OpenMetadataSnowflake", name, opts);

    this.role = new snowflake.Role(
      "role",
      {
        name: args.name.toUpperCase(),
      },
      { parent: this }
    );

    new snowflake.RoleGrants(
      "role->deployment",
      {
        roleName: this.role.name,
        roles: ["DEPLOYMENT"],
      },
      { parent: this }
    );

    this.warehouse = new snowflake.Warehouse(
      "warehouse",
      {
        name: args.name.toUpperCase(),
      },
      { parent: this }
    );

    new snowflake.GrantPrivilegesToRole(
      "wh-usage",
      {
        roleName: this.role.name,
        privileges: ["OPERATE", "USAGE"],
        onAccountObject: {
          objectType: "WAREHOUSE",
          objectName: this.warehouse.name,
        },
      },
      { parent: this }
    );

    const password = new random.RandomPassword(
      "snowflake-password",
      {
        length: 16,
      },
      { parent: this }
    );

    this.user = new snowflake.User(
      "user",
      {
        name: args.name.toUpperCase(),
        defaultRole: this.role.name,
        defaultWarehouse: this.warehouse.name,
        password: password.result,
      },
      { parent: this }
    );

    this.registerOutputs({
      user: this.user,
      role: this.role,
      warehouse: this.warehouse,
    });
  }
}
