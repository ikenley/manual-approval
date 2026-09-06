import { type Request, type Response, Router } from "express";
import type AuthenticationMiddlewareProvider from "../../auth/AuthenticationMiddlewareProvider.ts";
import type AuthorizationMiddleware from "../../auth/AuthorizationMiddleware.ts";
import type { ApiCradle } from "../../container/Cradle.ts";
import { getRequestScope } from "../../container/getRequestScope.ts";
import type { RequestImageParams } from "../../types/index.ts";

const route = Router();

export default class ImageController {
  protected authenticationMiddlewareProvider: AuthenticationMiddlewareProvider;
  protected authorizationMiddleware: AuthorizationMiddleware;

  constructor({
    authenticationMiddlewareProvider,
    authorizationMiddleware,
  }: ApiCradle) {
    this.authenticationMiddlewareProvider = authenticationMiddlewareProvider;
    this.authorizationMiddleware = authorizationMiddleware;
  }

  public registerRoutes(app: Router) {
    app.use("/image", route);

    route.use(this.authenticationMiddlewareProvider.provide());
    route.use(this.authorizationMiddleware.isAuthorized);

    route.post(
      "/",
      async (
        req: Request<unknown, unknown, RequestImageParams>,
        res: Response,
      ) => {
        const { imageMetadataService } = getRequestScope(res).cradle;
        await imageMetadataService.publishImageRequest(req.body);
        res.send({});
      },
    );
  }
}
