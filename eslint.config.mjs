import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Anchor/Solana program tests — not part of the Next.js app
    "crewboard_escrow/**",
  ]),
  {
    rules: {
      // Pre-existing codebase pattern — downgrade to warn
      "@typescript-eslint/no-explicit-any": "warn",
      // <img> vs <Image> — informational only
      "@next/next/no-img-element": "warn",
      // Fires false positives in server components (Date.now etc.)
      "react-hooks/purity": "off",
      // SSR hydration pattern (setMounted(true)) — pre-existing throughout codebase
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
