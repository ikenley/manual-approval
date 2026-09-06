import { SFNClient } from "@aws-sdk/client-sfn";
import { GoogleGenAI } from "@google/genai";
import { asFunction, asValue } from "awilix";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { NIL } from "uuid";
import { describe, expect, test } from "vitest";
import User from "../../src/auth/User.ts";
import buildApiContainer from "../../src/container/buildApiContainer.ts";
import buildJobRunnerContainer, {
  JOB_RUNNER_USER_EMAIL,
} from "../../src/container/buildJobRunnerContainer.ts";
import type { ApiCradle } from "../../src/container/Cradle.ts";

/**
 * Validation harness for the awilix containers (see docs/di-migration.md).
 *
 * Registration *completeness* is enforced at compile time: the registration
 * tables are typed as `{ [K in keyof Cradle]: Resolver<...> }`, so a missing key
 * is a build error, not something a test has to catch. What is left for runtime
 * is that the values resolve, that every registered class can be constructed
 * from its cradle, that the lifetimes are what we intended, and that the
 * request-scoped keys fail loudly outside a request.
 */
const TEST_REQUEST_ID = "11111111-1111-1111-1111-111111111111";

const testUser = new User(
  "00000000-0000-0000-0000-000000000001",
  "authorized@example.com",
);

const API_KEYS = [
  "aiController",
  "aiService",
  "authenticationMiddlewareProvider",
  "authorizationMiddleware",
  "bedrockAgentClient",
  "bedrockRuntimeClient",
  "chatController",
  "chatService",
  "config",
  "dynamoDBDocumentClient",
  "emailService",
  "expressLoader",
  "imageController",
  "imageMetadataRepository",
  "imageMetadataService",
  "jwtValidationService",
  "jwtVerifier",
  "logger",
  "loggerProvider",
  "requestId",
  "routeService",
  "sesClient",
  "sfnClient",
  "sqsClient",
  "statusController",
  "storybookController",
  "storybookService",
  "user",
];

const JOB_RUNNER_KEYS = [
  "config",
  "dynamoDBDocumentClient",
  "emailService",
  "genAI",
  "imageGeneratorService",
  "imageMetadataRepository",
  "imageMetadataService",
  "jobRunnerService",
  "logger",
  "loggerProvider",
  "requestId",
  "s3Client",
  "sesClient",
  "sqsClient",
  "user",
];

describe("API container", () => {
  test("builds without resolving anything eagerly", () => {
    expect(() => buildApiContainer()).not.toThrow();
  });

  test("registers exactly the expected keys", () => {
    const container = buildApiContainer();

    expect(Object.keys(container.registrations).sort()).toEqual(API_KEYS);
  });

  test("resolves the leaf values", () => {
    const { cradle } = buildApiContainer();

    expect(cradle.config.app.name).toBe("ai-api-test");
    expect(cradle.logger).toBeDefined();
    expect(cradle.sfnClient).toBeInstanceOf(SFNClient);
    expect(cradle.jwtVerifier).toBeInstanceOf(CognitoJwtVerifier);
  });

  test("treats singletons as shared across scopes", () => {
    const container = buildApiContainer();
    const first = container.createScope();
    const second = container.createScope();

    expect(first.cradle.sqsClient).toBe(second.cradle.sqsClient);
  });

  describe("request-scoped keys", () => {
    test.each(["requestId", "user"])(
      "%s throws a named error when resolved from the root",
      (key) => {
        const container = buildApiContainer();

        expect(() => (container.cradle as any)[key]).toThrow(
          /is request-scoped/,
        );
      },
    );

    test("resolve once the scope supplies them", () => {
      const scope = buildApiContainer().createScope();
      scope.register({
        requestId: asValue(TEST_REQUEST_ID),
        user: asValue(testUser),
      });

      expect(scope.cradle.requestId).toBe(TEST_REQUEST_ID);
      expect(scope.cradle.user.email).toBe("authorized@example.com");
    });
  });

  /**
   * The reason this migration uses awilix rather than hand-written wiring: a
   * singleton that captures a request-scoped value is the exact shape of the
   * bug that froze a NIL request id into the auth middleware's logger.
   */
  test("strict mode rejects a singleton that captures a request-scoped dependency", () => {
    const container = buildApiContainer();
    container.register({
      leaky: asFunction(({ requestId }: ApiCradle) => requestId).singleton(),
    } as any);

    const scope = container.createScope();
    scope.register({ requestId: asValue(TEST_REQUEST_ID) });

    expect(() => (scope.cradle as any).leaky).toThrow(
      /has a shorter lifetime than its ancestor/,
    );
  });

  /** The same wiring, correctly scoped, must still resolve — otherwise the test
   *  above would pass for the wrong reason. */
  test("a scoped consumer of a request-scoped dependency resolves normally", () => {
    const container = buildApiContainer();
    container.register({
      wellBehaved: asFunction(({ requestId }: ApiCradle) => requestId).scoped(),
    } as any);

    const scope = container.createScope();
    scope.register({ requestId: asValue(TEST_REQUEST_ID) });

    expect((scope.cradle as any).wellBehaved).toBe(TEST_REQUEST_ID);
  });
});

describe("job runner container", () => {
  test("builds without resolving anything eagerly", () => {
    expect(() => buildJobRunnerContainer()).not.toThrow();
  });

  test("registers exactly the expected keys", () => {
    const container = buildJobRunnerContainer();

    expect(Object.keys(container.registrations).sort()).toEqual(
      JOB_RUNNER_KEYS,
    );
  });

  test("resolves the leaf values", () => {
    const { cradle } = buildJobRunnerContainer();

    expect(cradle.config.app.name).toBe("ai-api-test");
    expect(cradle.genAI).toBeInstanceOf(GoogleGenAI);
  });

  /** Unlike the API, this container has a single implicit context, so both
   *  request-scoped keys carry concrete placeholder values. */
  test("supplies a placeholder request id and user", () => {
    const { cradle } = buildJobRunnerContainer();

    expect(cradle.requestId).toBe(NIL);
    expect(cradle.user.email).toBe(JOB_RUNNER_USER_EMAIL);
  });
});

/**
 * Full graph resolution. This supersedes the tsyringe resolution harnesses that
 * container.test.ts and jobRunnerContainer.test.ts provided: registration
 * completeness is now a compile error, so what is left to prove at runtime is
 * that every registered class can actually be constructed from its cradle.
 */
const API_BOOT_TIME_KEYS = [
  "expressLoader",
  "routeService",
  "aiController",
  "chatController",
  "imageController",
  "statusController",
  "storybookController",
  "authenticationMiddlewareProvider",
  "authorizationMiddleware",
] as const;

const API_REQUEST_SCOPED_KEYS = [
  "loggerProvider",
  "jwtValidationService",
  "emailService",
  "imageMetadataRepository",
  "imageMetadataService",
  "aiService",
  "chatService",
  "storybookService",
] as const;

const JOB_RUNNER_CLASS_KEYS = [
  "jobRunnerService",
  "imageGeneratorService",
  "imageMetadataService",
  "imageMetadataRepository",
  "emailService",
  "loggerProvider",
] as const;

const apiRequestScope = () => {
  const scope = buildApiContainer().createScope();
  scope.register({
    requestId: asValue(TEST_REQUEST_ID),
    user: asValue(testUser),
  });
  return scope;
};

describe("API graph resolution", () => {
  test.each(API_BOOT_TIME_KEYS)("resolves %s at boot", (key) => {
    expect(buildApiContainer().cradle[key]).toBeDefined();
  });

  test.each(API_REQUEST_SCOPED_KEYS)(
    "resolves %s in a request scope",
    (key) => {
      expect(apiRequestScope().cradle[key]).toBeDefined();
    },
  );

  test("scoped services are shared within a request but not across requests", () => {
    const container = buildApiContainer();
    const scopeFor = () => {
      const scope = container.createScope();
      scope.register({
        requestId: asValue(TEST_REQUEST_ID),
        user: asValue(testUser),
      });
      return scope;
    };

    const first = scopeFor();
    const second = scopeFor();

    expect(first.cradle.emailService).toBe(first.cradle.emailService);
    expect(first.cradle.emailService).not.toBe(second.cradle.emailService);
  });

  /**
   * The bug this migration set out to fix. A LoggerProvider built in a request
   * scope carries that request's id; there is no longer any way to obtain one
   * carrying NIL, because the root registration throws and strict mode stops a
   * singleton from capturing a scoped value.
   */
  test("LoggerProvider carries the real request id", () => {
    const scope = apiRequestScope();

    expect((scope.cradle.loggerProvider as any).requestId).toBe(
      TEST_REQUEST_ID,
    );
  });
});

describe("job runner graph resolution", () => {
  test.each(JOB_RUNNER_CLASS_KEYS)("resolves %s", (key) => {
    expect(buildJobRunnerContainer().cradle[key]).toBeDefined();
  });

  test("wires the placeholder user through to the services", () => {
    const { cradle } = buildJobRunnerContainer();

    expect((cradle.imageMetadataService as any).user.email).toBe(
      JOB_RUNNER_USER_EMAIL,
    );
  });
});
