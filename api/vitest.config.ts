import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.ts"],
    // Runs before any test module is imported, so hermetic env vars are in
    // place before src/config/index.ts calls dotenv.config().
    setupFiles: ["./tests/setup/testEnv.ts"],
    coverage: {
      // Report on the application only; the harness under tests/ is not
      // subject under test.
      include: ["src/**"],
    },
  },
});
