import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-require-imports": "off",
      "no-empty": "warn",
      "svelte/no-at-html-tags": "warn",
      "svelte/require-each-key": "warn",
      "svelte/prefer-svelte-reactivity": "warn",
      "svelte/no-immutable-reactive-statements": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", ".svelte-kit/", "build/"],
  },
];
