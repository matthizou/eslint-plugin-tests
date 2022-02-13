const rule = require('./descriptions-in-tests')
const RuleTester = require('eslint').RuleTester
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  }
})

const { errorMessages } = rule

ruleTester.run('jest-descriptions-first-word', rule, {
  valid: [
    {
      code: `it("does nothing", () => {})`
    },
    {
      code: `it("returns nothing", () => {})`
    },
    {
      code: `it("should do nothing", () => {})`,
      errors: [{ message: errorMessages.VAGUE_START }],
      options: [{ noVagueVerbs: false }]
    }
  ],

  invalid: [
    {
      code: `it("", () => {})`,
      errors: [{ message: errorMessages.REQUIRED_DESCRIPTION }]
    },
    {
      code: `it("Does nothing", () => {})`,
      errors: [{ message: errorMessages.NO_CAPITALIZATION }]
    },
    {
      code: `it("do nothing", () => {})`,
      errors: [{ message: errorMessages.WRONG_GRAMMAR }]
    },
    {
      code: `it("don't do anything", () => {})`,
      errors: [{ message: errorMessages.WRONG_GRAMMAR }]
    },
    {
      code: `it("make nothing", () => {})`,
      errors: [{ message: errorMessages.WRONG_GRAMMAR_ADD_S }]
    },
    {
      code: `it("should do nothing", () => {})`,
      errors: [{ message: errorMessages.VAGUE_START }],
      options: [{ noVagueVerbs: true }]
    },
    {
      code: `it("not return anything", () => {})`,
      errors: [{ message: errorMessages.GENERIC_ERROR }]
    }
  ]
})
