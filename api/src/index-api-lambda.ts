import { SSMClient } from "@aws-sdk/client-ssm";
import { configure as serverlessExpress } from "@vendia/serverless-express";
import type { ALBEvent, Context } from "aws-lambda";
import express from "express";
import { requireEnv } from "./config/env.ts";
import { getConfigOptions } from "./config/index.ts";
import buildApiContainer from "./container/buildApiContainer.ts";
import Logger from "./loaders/logger.ts";
import SsmParamLoader from "./loaders/SsmParamLoader.ts";

let serverlessExpressInstance: any = null;

const setup = async (event: ALBEvent, context: Context) => {
  // Inject SSM param configuration into env vars
  const ssmClient = new SSMClient();
  const ssmParamLoader = new SsmParamLoader(ssmClient);
  const configParamName = requireEnv("CONFIG_SSM_PARAM_NAME");
  await ssmParamLoader.loadToEnv(configParamName);

  const config = getConfigOptions();
  const app = express();

  // Built after loadToEnv, since the container reads config from env vars
  const container = buildApiContainer();
  await container.cradle.expressLoader.load(app, container);

  app
    .listen(config.port, () => {
      Logger.info(`
#####################################
🤖  Server listening on port: ${config.port} 🤖
#####################################
    `);
    })
    .on("error", (err) => {
      Logger.error(err);
      process.exit(1);
    });

  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
};

/** Main entrypoint for Lambda function version of express app */
export const handler = (event: ALBEvent, context: Context) => {
  console.log("event", event);

  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }

  return setup(event, context);
};

export default handler;
