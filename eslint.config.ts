import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist", ".output", ".vinxi"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",

      // formatting rules (prettier defaults)
      "quotes": ["warn", "double"],
      "semi": ["warn", "always"],
      "indent": ["warn", 2, { SwitchCase: 1 }],
      "comma-dangle": ["warn", "always-multiline"],
      "eol-last": ["warn", "always"],
      "no-trailing-spaces": "warn",
      "object-curly-spacing": ["warn", "always"],
      "arrow-parens": ["warn", "always"],
      "max-len": ["warn", { code: 80, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
    },
  },
];
