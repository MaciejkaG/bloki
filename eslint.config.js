import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser, // Merge browser globals
      },
    },
    files: [
      "public/assets/js/**/*.js",
      "public/assets/lib/**/*.js"
    ],
    rules: {
      semi: "error",
      "no-undef": "off", // Ignore undefined variables
      "no-unused-vars": "warn", // Ignore unused variables
    },
  },
  {
    ...pluginJs.configs.recommended, // Spread recommended settings
    languageOptions: {
      globals: {
        ...globals.node, // Include browser globals here as well
      },
    },
    rules: {
      "no-undef": "off", // Ignore undefined variables
      "no-unused-vars": "warn", // Ignore unused variables
    },
  },
];
