import { Router } from "express";
import type { ConfigOptions } from "../../config/index.ts";
import type { ApiCradle } from "../../container/Cradle.ts";

const route = Router();

export default class StatusController {
  protected config: ConfigOptions;

  constructor({ config }: ApiCradle) {
    this.config = config;
  }

  public registerRoutes(app: Router) {
    app.use("/status", route);

    route.get("/", (_req, res) => {
      res.send({ status: "ok" });
    });

    route.get("/health", (_req, res) => {
      res.send({ status: "ok" });
    });

    route.get("/info", (_req, res) => {
      res.send(this.config.app);
    });

    route.get("/error/:statusCode", (req, res) => {
      const statusCode = parseInt(req.params.statusCode, 10);
      res.status(statusCode);
      res.send(this.config.app);
    });
  }
}
