import { SSMClient } from "@aws-sdk/client-ssm";
import type { Context, SQSEvent } from "aws-lambda";
import type JobRunnerService from "./components/image/JobRunnerService.ts";
import { requireEnv } from "./config/env.ts";
import buildJobRunnerContainer from "./container/buildJobRunnerContainer.ts";
import SsmParamLoader from "./loaders/SsmParamLoader.ts";

let jobRunnerService: JobRunnerService | null = null;

/** Initial setup which should run on lambda startup. */
const setup = async (event: SQSEvent) => {
  // Inject SSM param configuration into env vars
  const ssmClient = new SSMClient();
  const ssmParamLoader = new SsmParamLoader(ssmClient);
  const configParamName = requireEnv("CONFIG_SSM_PARAM_NAME");
  await ssmParamLoader.loadToEnv(configParamName);

  // Built after loadToEnv, since the container reads config from env vars
  const container = buildJobRunnerContainer();

  jobRunnerService = container.cradle.jobRunnerService;
  return jobRunnerService.handleEvent(event);
};

/** Main entrypoint for Lambda function version of express app */
export const handler = (event: SQSEvent, _context: Context) => {
  if (jobRunnerService) {
    return jobRunnerService.handleEvent(event);
  }

  return setup(event);
};

export default handler;
