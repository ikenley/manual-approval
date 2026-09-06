import type express from "express";
import request from "supertest";
import { NIL } from "uuid";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import {
  API_PREFIX,
  AUTHORIZED_EMAIL,
  buildTestApp,
  jwtVerifierStub,
  PUN_TEXT,
  sfnStub,
  sqsStub,
  TEST_USER_ID,
  UNAUTHORIZED_EMAIL,
} from "../helpers/buildTestApp.ts";

/**
 * Characterization test for the HTTP surface.
 *
 * This exists to protect the tsyringe -> awilix migration (see
 * docs/di-migration.md). It asserts observable behaviour only — status codes,
 * response bodies, and what reaches the outbound clients — so it should pass
 * unchanged before and after the container swap.
 *
 * One exception is called out in container.test.ts: the request-id propagation
 * bug is deliberately *not* locked in here.
 */
let app: express.Application;

beforeAll(async () => {
  app = await buildTestApp();
});

beforeEach(() => {
  jwtVerifierStub.email = AUTHORIZED_EMAIL;
  sqsStub.sent.length = 0;
  sfnStub.sent.length = 0;
});

describe("status routes (unauthenticated)", () => {
  test("GET /status returns ok", async () => {
    const response = await request(app).get(`${API_PREFIX}/status`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("GET /status/health returns ok", async () => {
    const response = await request(app).get(`${API_PREFIX}/status/health`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("GET /status/info returns the app config block", async () => {
    const response = await request(app).get(`${API_PREFIX}/status/info`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      env: "test",
      name: "ai-api-test",
      version: "0.0.0-test",
    });
  });
});

describe("authentication", () => {
  test("rejects a request with no Authorization header", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/ai/pun`)
      .send({ prompt: "containers" });

    expect(response.statusCode).toBe(401);
  });

  test("rejects a malformed Authorization header", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/ai/pun`)
      .set("Authorization", "Bearer")
      .send({ prompt: "containers" });

    expect(response.statusCode).toBe(401);
  });

  test("rejects a token the verifier refuses", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/ai/pun`)
      .set("Authorization", "Bearer invalid")
      .send({ prompt: "containers" });

    expect(response.statusCode).toBe(401);
  });

  test("accepts a valid token and resolves the service from the request scope", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/ai/pun`)
      .set("Authorization", "Bearer valid")
      .send({ prompt: "containers" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ content: PUN_TEXT });
  });
});

describe("authorization", () => {
  test("rejects an authenticated user who is not on the allow-list", async () => {
    jwtVerifierStub.email = UNAUTHORIZED_EMAIL;

    const response = await request(app)
      .post(`${API_PREFIX}/image`)
      .set("Authorization", "Bearer valid")
      .send({ prompt: "a cat" });

    expect(response.statusCode).toBe(403);
    expect(sqsStub.sent).toHaveLength(0);
  });

  test("allows a user on the allow-list, and the request-scoped User reaches the service", async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/image`)
      .set("Authorization", "Bearer valid")
      .send({ prompt: "a cat" });

    expect(response.statusCode).toBe(200);

    // The User is registered into the per-request child container by the auth
    // middleware and injected several levels down the graph. Asserting on the
    // queued message proves that path end to end.
    expect(sqsStub.sent).toHaveLength(1);
    expect(sqsStub.sent[0]).toMatchObject({
      prompt: "a cat",
      email: AUTHORIZED_EMAIL,
      userId: TEST_USER_ID,
    });
  });
});

/**
 * The bug that motivated the migration, asserted end to end.
 *
 * StorybookService names its Step Function execution after the request id, so
 * what reaches the SFN client is direct evidence of which request id the graph
 * was built with. Under the old wiring anything constructed at boot was stuck
 * with NIL; each request must now carry its own id, and two requests must
 * differ.
 */
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("request-scoped request id", () => {
  test("each request carries its own id, and never the NIL placeholder", async () => {
    const story = { title: "T", description: "D", artNote: "A" };

    await request(app)
      .post(`${API_PREFIX}/storybook`)
      .set("Authorization", "Bearer valid")
      .send(story)
      .expect(200);
    await request(app)
      .post(`${API_PREFIX}/storybook`)
      .set("Authorization", "Bearer valid")
      .send(story)
      .expect(200);

    expect(sfnStub.sent).toHaveLength(2);

    const [first, second] = sfnStub.sent;
    expect(first.name).toMatch(UUID_V4);
    expect(second.name).toMatch(UUID_V4);
    expect(first.name).not.toBe(NIL);
    expect(first.name).not.toBe(second.name);
  });
});
