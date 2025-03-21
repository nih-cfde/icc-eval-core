import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginVue from "eslint-plugin-vue";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,vue}"],
  },
  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "vite.config.ts"],
  },
  {
    extends: [
      eslintPluginVue.configs["flat/essential"],
      vueTsConfigs.recommended,
      eslintConfigPrettier,
      eslintPluginPrettierRecommended,
    ],
    rules: {
      "prettier/prettier": "warn",
      "prefer-const": ["error", { destructuring: "all" }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true, caughtErrors: "none" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
