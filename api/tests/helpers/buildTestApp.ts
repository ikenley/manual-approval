import { asValue } from "awilix";
import express from "express";
import buildApiContainer from "../../src/container/buildApiContainer.ts";

export const AUTHORIZED_EMAIL = "authorized@example.com";
export const UNAUTHORIZED_EMAIL = "stranger@example.com";
export const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
export const PUN_TEXT =
  "Why did the container create a scope? To resolve itself.";

/** Stands in for the Cognito verifier. `email` is mutable so a test can change
 *  which user the token resolves to; the literal token "invalid" is rejected. */
export const jwtVerifierStub = {
  email: AUTHORIZED_EMAIL,
  verify: async (token: string) => {
    if (token === "invalid") {
      throw new Error("stub verifier: rejected token");
    }
    return { sub: TEST_USER_ID, email: jwtVerifierStub.email };
  },
};

export const bedrockRuntimeStub = {
  send: async () => ({
    body: new TextEncoder().encode(
      JSON.stringify({ content: [{ text: PUN_TEXT }] }),
    ),
  }),
};

/** Captures the messages the app would have put on the job queue, so tests can
 *  assert on what crossed the boundary. */
export const sqsStub = {
  sent: [] as any[],
  send: async (command: any) => {
    sqsStub.sent.push(JSON.parse(command.input.MessageBody));
    return {};
  },
};

export const dynamoDBStub = {
  send: async () => ({}),
};

/** Captures Step Function executions. The execution name is the request id,
 *  which makes this the end-to-end probe for request-scoped values. */
export const sfnStub = {
  sent: [] as any[],
  send: async (command: any) => {
    sfnStub.sent.push(command.input);
    return {};
  },
};

let app: express.Application | null = null;

/**
 * Boots the real Express app through the real DI loader, replacing only the
 * outbound clients. Everything between the HTTP boundary and those clients —
 * routing, both auth middlewares, the request-scoped child container, and the
 * full service graph — is the production wiring.
 *
 * Call this at most once per module registry — Vitest gives each test file its
 * own. Controllers register their handlers onto module-level `Router()`
 * singletons, so a second boot inside one test file would stack duplicate
 * handlers onto the same router.
 */
export const buildTestApp = async () => {
  if (app) {
    return app;
  }

  const container = buildApiContainer();

  // Re-registering a key on the root container replaces it, and scopes inherit
  // from the root, so these reach request-scoped consumers too. The casts are
  // because the stubs implement only the handful of methods the code calls.
  container.register({
    jwtVerifier: asValue(jwtVerifierStub as any),
    bedrockRuntimeClient: asValue(bedrockRuntimeStub as any),
    dynamoDBDocumentClient: asValue(dynamoDBStub as any),
    sqsClient: asValue(sqsStub as any),
    sfnClient: asValue(sfnStub as any),
  });

  app = express();
  await container.cradle.expressLoader.load(app, container);

  return app;
};

/** Matches `config.api.prefix`. */
export const API_PREFIX = "/ai/api";
