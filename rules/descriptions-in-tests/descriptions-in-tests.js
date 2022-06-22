"use strict";
const emojiconize = require("../helpers/emojiconize");

const errorMessages = emojiconize({
  DUPLICATED_IT:
    "Don't start with `it`. By convention, the function name,`it`, is part of the description",
  REQUIRED_DESCRIPTION: "Missing description",
  GENERIC_ERROR: "Hm, that does not seem right",
  NO_CAPITALIZATION: "Start descriptions with a lower-case letter",
  WRONG_GRAMMAR: 'The first verb must be conjugated with "it"',
  WRONG_GRAMMAR_ADD_S:
    'Add a "s" at the end of this verb to conjugate it with the subject "it"',
  VAGUE_START:
    "Avoid vague start of descriptions (should, could, may, might). Be assertive!",
});

const COMMON_REGULAR_VERBS = [
  "accept",
  "add",
  "allow",
  "build",
  "call",
  "change",
  "close",
  "create",
  "disable",
  "display",
  "execute",
  "fire",
  "format",
  "get",
  "hide",
  "include",
  "initialize",
  "invoke",
  "load",
  "make",
  "mark",
  "mount",
  "open",
  "perform",
  "prefill",
  "redirect",
  "reject",
  "remain",
  "remove",
  "rename",
  "render",
  "return",
  "revert",
  "run",
  "select",
  "set",
  "show",
  "submit",
  "toggle",
  "track",
  "throw",
  "trigger",
];

// For those ones cannot be conjugated with 'it' by just adding a final 's'
const COMMON_IRREGULAR_VERBS = {
  apply: "applies",
  be: "is",
  dispatch: "dispatches",
  do: "does",
  go: "goes",
  have: "has",
  "don't": "doesn't",
};
const VAGUE_VERBS = ["should", "could", "may", "might"];

module.exports = {
  meta: {
    schema: [
      {
        noVagueVerbs: {
          type: "boolean",
        },
      },
    ],
    type: "suggestion",
    docs: {
      description: "Normalize tests' descriptions",
    },
    fixable: "code",
  },

  create(context) {
    const options = {
      noVagueVerbs: false,
      ...context.options[0],
    };

    const sourceCode = context.getSourceCode();

    return {
      CallExpression(node) {
        const { callee = {} } = node;
        if (callee.type === "Identifier" && callee.name === "it") {
          const args = node.arguments || [];
          if (args.length > 0 && args[0].type === "Literal") {
            const descriptionNode = args[0];
            const { message, startIndex, endIndex, fix } = analyse(
              sourceCode.getFirstToken(descriptionNode),
              options
            );
            if (message) {
              const loc = {
                start: sourceCode.getLocFromIndex(startIndex),
                end: sourceCode.getLocFromIndex(endIndex),
              };
              context.report({
                loc,
                message,
                data: {},
                fix,
              });
            }
          }
        }
      },
    };
  },

  errorMessages,
};

function analyse(node, { noVagueVerbs }) {
  const stringDelimiter = node.value[0];
  const text = node.value.slice(1, -1);
  const startIndex = node.range[0];
  const endIndex = node.range[1];
  let newDescription;

  if (text.length === 0) {
    return {
      message: errorMessages.REQUIRED_DESCRIPTION,
      startIndex,
      endIndex,
    };
  }
  const [firstWord, secondWord] = text.split(" ");
  let message;
  let fix;
  if (firstWord.match(/^[A-Z]/)) {
    message = errorMessages.NO_CAPITALIZATION;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text[0].toLowerCase()}${text.slice(
        1
      )}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  }
  if (COMMON_REGULAR_VERBS.includes(firstWord)) {
    message = errorMessages.WRONG_GRAMMAR_ADD_S;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text.slice(
        0,
        firstWord.length
      )}s${text.slice(firstWord.length)}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  }
  if (COMMON_IRREGULAR_VERBS[firstWord]) {
    message = errorMessages.WRONG_GRAMMAR;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${
        COMMON_IRREGULAR_VERBS[firstWord]
      }${text.slice(firstWord.length)}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  }
  if (noVagueVerbs && VAGUE_VERBS.includes(firstWord)) {
    message = errorMessages.VAGUE_START;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text
        .slice(firstWord.length)
        .trim()}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  }
  if (firstWord === "not") {
    // This rule is added for the autofix (run recursively)
    // "should not create" --> "not create" --> "does not create"
    message = errorMessages.GENERIC_ERROR;
    fix = (fixer) => {
      let newDescription;
      if (secondWord === "be") {
        // Passive form
        // "should not be created" --> "not be create" --> "is not called"
        newDescription = `${stringDelimiter}is not${text.replace(
          "not be",
          ""
        )}${stringDelimiter}`;
      } else {
        newDescription = `${stringDelimiter}does ${text}${stringDelimiter}`;
      }
      return fixer.replaceText(node, newDescription);
    };
  }
  if (firstWord === "it") {
    message = errorMessages.DUPLICATED_IT;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text
        .slice(firstWord.length)
        .trim()}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  }

  return {
    message,
    startIndex: startIndex + 1,
    endIndex: startIndex + 1 + firstWord.length,
    fix,
  };
}
