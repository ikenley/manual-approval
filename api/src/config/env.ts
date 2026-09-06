import dotenv from "dotenv";

// The env-var bootstrap lives here rather than in config/index.ts so that any
// module reading env vars gets it by importing the readers below, regardless of
// where it sits in the import graph. logger.ts in particular is evaluated
// before config/index.ts in some entrypoints.
// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({ path: "../.env" });

/** Read a required env var, failing fast if it is absent.
 *
 * Empty string counts as absent: an unset var and a var set to "" are the
 * same configuration mistake, and neither is a usable bucket name or domain.
 */
export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

/** Read an env var that is allowed to be absent. */
export const optionalEnv = (name: string, fallback = ""): string =>
  process.env[name] ?? fallback;
