import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import typescriptEslint from "typescript-eslint";
import eslint from "@eslint/js";

export default typescriptEslint.config({
  extends: [
    eslint.configs.recommended,
    typescriptEslint.configs.recommended,
    typescriptEslint.configs.stylistic,
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
});
