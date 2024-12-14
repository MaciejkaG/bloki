import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser, // Merge browser globals
      },
    },
    files: ["public/assets/js/**/*.js"],
    rules: {
      semi: "error",
    },
  },
  {
    ...pluginJs.configs.recommended, // Spread recommended settings
    languageOptions: {
      globals: {
        ...globals.browser, // Include browser globals here as well
      },
    },
  },
];