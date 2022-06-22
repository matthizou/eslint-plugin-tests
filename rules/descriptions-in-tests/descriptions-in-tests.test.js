const rule = require("./descriptions-in-tests");
const RuleTester = require("eslint").RuleTester;
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 8,
    sourceType: "module",
  },
});

const { errorMessages } = rule;

ruleTester.run("jest-descriptions-first-word", rule, {
  valid: [
    {
      code: `it("does nothing", () => {})`,
    },
    {
      code: `it("returns nothing", () => {})`,
    },
    {
      code: `it("should do nothing", () => {})`,
      errors: [{ message: errorMessages.VAGUE_START }],
      options: [{ noVagueVerbs: false }],
    },
  ],

  invalid: [
    {
      code: `it("", () => {})`,
      errors: [{ message: errorMessages.REQUIRED_DESCRIPTION }],
      output: 'it("", () => {})',
    },
    {
      code: `it("Does something", () => {})`,
      errors: [{ message: errorMessages.NO_CAPITALIZATION }],
      output: 'it("does something", () => {})',
    },
    {
      code: `it("do something", () => {})`,
      errors: [{ message: errorMessages.WRONG_GRAMMAR }],
      output: 'it("does something", () => {})',
    },
    {
      code: `it("don't do anything", () => {})`,
      errors: [{ message: errorMessages.WRONG_GRAMMAR }],
      output: 'it("doesn\'t do anything", () => {})',
    },
    {
      code: `it("make bread", () => {})`,
      errors: [{ message: errorMessages.WRONG_GRAMMAR_ADD_S }],
      output: 'it("makes bread", () => {})',
    },
    {
      code: `it("should do something", () => {})`,
      errors: [{ message: errorMessages.VAGUE_START }],
      options: [{ noVagueVerbs: true }],
      output: 'it("do something", () => {})', // Normally run recursively, so will become: `does`
    },
    {
      // Pattern seen in recursive autofix
      code: `it("it does something", () => {})`,
      errors: [{ message: errorMessages.DUPLICATED_IT }],
      output: 'it("does something", () => {})',
    },
    {
      // Pattern seen in recursive autofix
      code: `it("not return anything", () => {})`,
      errors: [{ message: errorMessages.GENERIC_ERROR }],
      output: 'it("does not return anything", () => {})',
    },
    {
      // Pattern seen in recursive autofix
      code: `it("not be called", () => {})`,
      errors: [{ message: errorMessages.GENERIC_ERROR }],
      output: 'it("is not called", () => {})',
    },
  ],
});
