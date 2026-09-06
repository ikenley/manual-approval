import { type AwilixContainer, asValue } from "awilix";
import type { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { ApiCradle } from "../container/Cradle.ts";

/**
 * Creates the request-level container scope.
 *
 * Everything request-shaped lives here: the request id used for log tracing,
 * and later the authenticated User, which the authentication middleware
 * registers onto this same scope.
 *
 * Takes the root container as an argument rather than importing a module-level
 * singleton, so tests and the two lambda entrypoints can each build their own.
 */
export const requestScopeMiddleware =
  (container: AwilixContainer<ApiCradle>) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const scope = container.createScope();
    scope.register({ requestId: asValue(uuidv4()) });

    res.locals.scope = scope;

    next();
  };

export default requestScopeMiddleware;
