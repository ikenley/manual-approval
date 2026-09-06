import type { AwilixContainer } from "awilix";
import type { Response } from "express";
import type { ApiCradle } from "./Cradle.ts";

/**
 * The per-request container scope attached by requestScopeMiddleware.
 *
 * Controllers and middleware are app-lifetime singletons — they register Express
 * handlers once at boot — so they cannot hold request-scoped dependencies as
 * fields. awilix's strict mode rejects that outright. They reach the current
 * request's graph through this accessor instead.
 */
export const getRequestScope = (res: Response): AwilixContainer<ApiCradle> =>
  res.locals.scope as AwilixContainer<ApiCradle>;

export default getRequestScope;
