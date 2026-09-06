/**
 * Placeholder resolver for a key that only a request scope can supply.
 *
 * The API container has to declare `requestId` and `user` so the cradle type is
 * complete, but neither has a meaningful value at boot. Registering a thrower
 * turns "resolved something that needs a user outside a request" into an
 * immediate, named failure.
 *
 * This replaces two silent failure modes in the tsyringe wiring: a NIL request
 * id registered at the root, which the auth middleware captured permanently,
 * and an unregistered User, which tsyringe reflected into
 * `new User(undefined, undefined)` rather than rejecting.
 */
export const requestScopedOnly = (key: string) => (): never => {
  throw new Error(
    `"${key}" is request-scoped and has no value outside a request. ` +
      `It is registered on the scope created by dependencyInjectionMiddleware; ` +
      `resolve it from res.locals.scope rather than the root container.`,
  );
};

export default requestScopedOnly;
