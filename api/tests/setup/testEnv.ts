/**
 * Hermetic environment for the test suite.
 *
 * This runs as a Vitest `setupFiles` entry, i.e. before any test module (and
 * therefore before `src/config/index.ts`) is imported. That ordering matters:
 * `src/config/index.ts` calls `dotenv.config({ path: "../.env" })` at module
 * load, and dotenv does not overwrite keys that are already present in
 * `process.env`. Setting them here means the repo-root `.env` cannot leak real
 * infrastructure values (or real credentials) into a test run.
 */
const testEnv: Record<string, string> = {
  APP_ENV: "test",
  APP_NAME: "ai-api-test",
  APP_VERSION: "0.0.0-test",
  AUTHORIZED_EMAILS: JSON.stringify(["authorized@example.com"]),
  AWS_REGION: "us-east-1",
  BASE_DOMAIN: "",
  BEDROCK_AGENT_ID: "TESTAGENTID",
  BEDROCK_AGENT_ALIAS_ID: "TESTALIASID",
  COGNITO_USER_POOL_ID: "us-east-1_testpool",
  COGNITO_USER_POOL_CLIENT_ID: "testclientid",
  COGNITO_USER_POOL_CLIENT_SECRET: "testclientsecret",
  FROM_EMAIL_ADDRESS: "noreply@example.com",
  GEMINI_API_KEY: "test-gemini-key",
  IMAGE_METADATA_TABLE_NAME: "test-image-metadata",
  IMAGE_S3_BUCKET_NAME: "test-image-bucket",
  JOB_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/000000000000/test-queue",
  LOGS__LEVEL: "error",
  PORT: "8086",
  STATE_FUNCTION_ARN: "arn:aws:states:us-east-1:000000000000:stateMachine:test",

  // Not read by getConfigOptions today, but present in the repo-root .env with
  // real values. Pinned here so a test run can never pick up a live secret.
  AUTH__CONFIG_SSM_PARAM_NAME: "/test/auth/config",
  AUTH__PORT: "8087",
  COGNITO_OAUTH_REDIRECT_URL_PREFIX: "http://localhost:3000",
  COGNITO_OAUTH_URL_PREFIX: "http://localhost:3000",
  CONFIG_SSM_PARAM_NAME: "/test/api/config",
  OPENAI_API_KEY: "test-openai-key",
};

for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] = value;
}

// Every outbound client is stubbed, but pin fake credentials anyway so that a
// missed stub fails loudly instead of reaching a real account.
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.AWS_SESSION_TOKEN = "test";
