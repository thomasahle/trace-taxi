import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  base: "/",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/main.ts",
        "**/*.config.*",
        "**/dist/**",
        "**/cli/**",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
