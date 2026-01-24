const {
    defineConfig,globalIgnores
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const preferArrow = require("eslint-plugin-prefer-arrow");
const _import = require("eslint-plugin-import");
const jsdoc = require("eslint-plugin-jsdoc");
const prettier = require("eslint-plugin-prettier");

const {
    fixupPluginRules,
} = require("@eslint/compat");

const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    ignores: ["src/alltestss.js"], //does not work in github actions for whatever reason
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        sourceType: "module",

        parserOptions: {
            project: "tsconfig.json",
        },
    },

    extends: compat.extends(
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:jsdoc/recommended",
        "prettier",
        "plugin:prettier/recommended",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "prefer-arrow": preferArrow,
        import: fixupPluginRules(_import),
        jsdoc,
        prettier,
    },

    rules: {
        "prettier/prettier": "error",
        "jsdoc/require-jsdoc": 0,// we can enable once we have filled in descriptions of all functions
        "jsdoc/require-param": 0,
        "jsdoc/require-param-type": 0,
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/consistent-type-definitions": "error",

        "@typescript-eslint/explicit-member-accessibility": ["error", {
            accessibility: "explicit",
        }],

        "@typescript-eslint/member-ordering": ["error", {
            default: [
                "static-field",
                "instance-field",
                "abstract-field",
                "constructor",
                "static-method",
                "instance-method",
                "abstract-method",
            ],
        }],

        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/triple-slash-reference": "error",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-body-style": "error",
        camelcase: "error",
        complexity: "off",
        "constructor-super": "error",
        curly: "error",
        "dot-notation": "error",
        "eol-last": "off",
        eqeqeq: ["error", "smart"],
        "guard-for-in": "error",

        "id-blacklist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
        ],

        "id-match": "error",
        "import/order": "off", //turned off, as it seem to report wrong results on windows?
        "max-classes-per-file": ["error", 1],
        "max-len": "off",
        "new-parens": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "off",
        "no-debugger": "error",
        "no-empty": "error",
        "no-eval": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-multiple-empty-lines": "error",
        "no-new-wrappers": "error",
        "no-shadow": "off",
        "@typescript-eslint/no-shadow": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "error",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "object-shorthand": "off",
        "one-var": ["error", "never"],
        "prefer-arrow/prefer-arrow-functions": "error",
        "prefer-const": "error",
        "quote-props": ["error", "consistent-as-needed"],
        radix: "error",

        "space-before-function-paren": ["error", {
            anonymous: "never",
            asyncArrow: "always",
            named: "never",
        }],

        "spaced-comment": "off",
        "use-isnan": "error",
        "valid-typeof": "off",
        "@typescript-eslint/no-inferrable-types": "off",

        // the default config is similar to ESLint's camelcase rule but more strict
        "@typescript-eslint/naming-convention": ["error", {
            selector: "default",
            format: ["camelCase"],
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
        }, {
            selector: "variable",
            format: ["camelCase", "UPPER_CASE"],
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
        }, {
            selector: "typeLike",
            format: ["PascalCase"],
        }, {
            //additionally make static constants uppercase
            selector: "property",
            modifiers: ["private", "static", "readonly"],
            format: ["UPPER_CASE"],
        }, {
            //Enforce that interface names do not begin with an I
            selector: "interface",
            format: ["PascalCase"],

            custom: {
                regex: "^I[A-Z]",
                match: false,
            },
        }],

        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/prefer-includes": "error",
        "@typescript-eslint/prefer-string-starts-ends-with": "error",
    },
}]);
