// Importing the env readers also runs the dotenv/NODE_ENV bootstrap in env.ts.
import { optionalEnv, requireEnv } from "./env.ts";

export type AppEnv = "local" | "test" | "dev" | "staging" | "prod";

export class ConfigOptions {
  api: { prefix: string };
  app: { env: AppEnv; name: string; version: string };
  authorizedEmails: string[];
  aws: {
    region: string;
  };
  baseDomain: string | null;
  bedrockAgent: {
    agentId: string;
    agentAliasId: string;
  };
  cognito: {
    userPoolId: string;
    userPoolClientId: string;
    userPoolClientSecret: string;
  };
  fromEmailAddress: string;
  googleGenAI: {
    apiKey: string;
  };
  imageMetadataTableName: string;
  imageS3BucketName: string;
  jobQueueUrl: string;
  // db: {
  //   host: string;
  //   port: number;
  //   user: string;
  //   password: string;
  //   database: string;
  //   schema: string;
  // };
  logs: { level: string };
  nodeEnv: string;
  port: number;
  stateFunctionArn: string;
}

/** Get ConfigOptions from env vars.
 * (This is a function to lazy-load and
 *    give bootstrap services time to inject env vars)
 */
export const getConfigOptions = () => {
  const authorizedEmailsJson = optionalEnv("AUTHORIZED_EMAILS", "[]");
  const authorizedEmails = JSON.parse(authorizedEmailsJson) as string[];

  const config: ConfigOptions = {
    api: { prefix: "/ai/api" },
    app: {
      env: optionalEnv("APP_ENV") as AppEnv,
      name: optionalEnv("APP_NAME", "ai-api"),
      version: requireEnv("APP_VERSION"),
    },
    authorizedEmails: authorizedEmails,
    aws: {
      region: requireEnv("AWS_REGION"),
    },
    baseDomain: optionalEnv("BASE_DOMAIN") || null,
    bedrockAgent: {
      agentId: requireEnv("BEDROCK_AGENT_ID"),
      agentAliasId: requireEnv("BEDROCK_AGENT_ALIAS_ID"),
    },
    cognito: {
      userPoolId: requireEnv("COGNITO_USER_POOL_ID"),
      userPoolClientId: requireEnv("COGNITO_USER_POOL_CLIENT_ID"),
      userPoolClientSecret: requireEnv("COGNITO_USER_POOL_CLIENT_SECRET"),
    },
    fromEmailAddress: requireEnv("FROM_EMAIL_ADDRESS"),
    googleGenAI: {
      apiKey: requireEnv("GEMINI_API_KEY"),
    },
    imageMetadataTableName: requireEnv("IMAGE_METADATA_TABLE_NAME"),
    jobQueueUrl: requireEnv("JOB_QUEUE_URL"),
    logs: { level: optionalEnv("LOGS__LEVEL", "http") },
    nodeEnv: requireEnv("NODE_ENV"),
    port: parseInt(optionalEnv("PORT", "8086"), 10),
    imageS3BucketName: requireEnv("IMAGE_S3_BUCKET_NAME"),
    stateFunctionArn: requireEnv("STATE_FUNCTION_ARN"),
  };

  return config;
};
