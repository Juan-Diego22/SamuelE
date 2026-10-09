import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  { ignores: ["dist/", ".astro/", ".wrangler/"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-recommended"],
  { files: ["*.mjs", "*.js"], languageOptions: { globals: globals.node } },
  // Las referencias de triple barra son la convención de Astro en env.d.ts
  {
    files: ["src/env.d.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
];
