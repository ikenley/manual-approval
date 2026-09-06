import express from "express";
import { getConfigOptions } from "./config/index.ts";
import buildApiContainer from "./container/buildApiContainer.ts";
import Logger from "./loaders/logger.ts";

async function startServer() {
  const config = getConfigOptions();
  const app = express();

  // Build the dependency graph, then configure Express. The container is passed
  // to load() so the request-scope middleware can create a child scope per
  // request — it cannot arrive through the cradle, being what builds it.
  const container = buildApiContainer();
  await container.cradle.expressLoader.load(app, container);

  app
    .listen(config.port, () => {
      Logger.info(`
#####################################
🤖  Server listening on port: ${config.port} 🤖
#####################################
    `);
    })
    .on("error", (err) => {
      Logger.error(err);
      process.exit(1);
    });
}

startServer();
