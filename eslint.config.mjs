import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  {
    ignores: ["dist/**", "node_modules/**"],
  },
]);

export default eslintConfig;
