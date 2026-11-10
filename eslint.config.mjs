import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // CommonJS a propósito: sin `"type": "module"` en package.json, Tailwind 3
    // lee el `.js` como CJS, y `components.json` (shadcn) apunta a este archivo.
    files: ["tailwind.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "server/db/migrations/**"]),
])
