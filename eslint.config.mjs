import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This experimental rule flags the extremely common "reset state,
      // then fetch" pattern (setData(null); setError(null); api.get()...)
      // used throughout this app's data-fetching pages. That pattern is
      // functionally correct (it's the standard way to clear stale state
      // before an async load) — downgraded to a warning rather than
      // restructured across every page, which would add indirection for
      // no behavioral benefit.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
