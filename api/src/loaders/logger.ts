import winston from "winston";
import { optionalEnv } from "../config/env.ts";

/** The logger deliberately reads its own env vars instead of taking
 * ConfigOptions. It is bootstrap infrastructure: it is imported at module scope
 * by the container builders, so it is constructed before the Lambda entrypoints
 * have injected SSM values into the environment, and getConfigOptions() would
 * throw on the required vars that arrive later. Every var below is baked into
 * the image at build time (see Dockerfile-lambda) and each has a fallback, so a
 * missing one degrades a log field rather than killing the process — which is
 * what you want from the thing that has to report configuration failures.
 */
const appMeta = {
  env: optionalEnv("APP_ENV"),
  name: optionalEnv("APP_NAME", "ai-api"),
  version: optionalEnv("APP_VERSION", "unknown"),
};

export const LoggerToken = "logger";

const transports = [];
if (process.env.NODE_ENV === "test") {
  transports.push(
    new winston.transports.File({ filename: `${appMeta.name}.log` }),
  );
} else {
  if (process.env.NODE_ENV !== "development") {
    transports.push(new winston.transports.Console());
  } else {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.metadata({
            fillExcept: ["message", "level", "timestamp", "label"],
          }),
          winston.format.printf(
            ({ timestamp, level, message, metadata }: any) => {
              const moduleName = metadata?.module
                ? ` [${metadata.module}]`
                : "";
              return `${timestamp} ${level}${moduleName}: ${message} ${
                metadata ? JSON.stringify(metadata) : ""
              }`;
            },
          ),
          winston.format.errors({ stack: true }),
        ),
      }),
    );
  }
}

const LoggerInstance = winston.createLogger({
  level: optionalEnv("LOGS__LEVEL", "http"),
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.json(),
    winston.format.errors({ stack: true }),
  ),
  transports,
  defaultMeta: {
    app: appMeta,
  },
});

export default LoggerInstance;
