import * as pulumi from "@pulumi/pulumi";
import { Datahub } from "./src/datahub";

interface InfrastructureArgs {
  datahub: {
    namespace: string;
  };
}

const config = new pulumi.Config();
const data = config.requireObject<InfrastructureArgs>("data");

export const datahub = new Datahub("datahub", {
  name: data.datahub.namespace,
});
