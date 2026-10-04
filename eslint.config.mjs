import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Flat config for ESLint 9 (`next lint` was removed in Next.js 16, so the
// `lint` script now runs `eslint .` directly).
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next 16 ships the React Compiler rules as errors. A few
    // pre-existing animation components (boot sequence, summit terminal,
    // hero) intentionally sync refs/state inside effects, so these are
    // surfaced as warnings until those components are refactored.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "build/**",
    ".wrangler/**",
    "out/**",
    "next-env.d.ts",
    "scripts/**",
    "skills/**",
  ]),
]);
