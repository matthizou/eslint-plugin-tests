"use strict";
const emojiconize = require("../helpers/emojiconize");

const MAX_SIZE = 100;
const errorMessages = emojiconize({
  DUPLICATED_IT:
    "Don't start with `it`. By convention, the function name,`it`, is part of the description",
  REQUIRED_DESCRIPTION: "Missing description",
  INVALID_START_OF_DESCRIPTION:
    "Invalid start of description. Use a conjugated verb instead",
  NO_CAPITALIZATION: "Start descriptions with a lower-case letter",
  TOO_LONG:
    "This description is too long, making it hard to read. Rephrase it and/or use a contextual `describe` to break it down",
  WRONG_GRAMMAR: 'The first verb must be conjugated with "it"',
  WRONG_GRAMMAR_ADD_S:
    'Add a "s" at the end of this verb to conjugate it with the subject "it"',
  VAGUE_START:
    "Avoid vague start of descriptions (should, could, may, might). Be assertive!",
  USE_OF_IF_INSTEAD_OF_WHEN:
    "For consistency, use `when` instead of `if` to start the context part of the description",
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
        preferWhenToIf: {
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

function analyse(node, { noVagueVerbs, preferWhenToIf }) {
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
  if (text.length > MAX_SIZE) {
    return {
      message: errorMessages.TOO_LONG,
      startIndex,
      endIndex,
    };
  }

  const [firstWord, secondWord] = text.split(" ");
  let errorStartIndex = startIndex + 1;
  let errorEndIndex = errorStartIndex + firstWord.length;

  let message;
  let fix;
  if (firstWord.match(/^[A-Z]/)) {
    // Starts with capital letter
    message = errorMessages.NO_CAPITALIZATION;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text[0].toLowerCase()}${text.slice(
        1
      )}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  } else if (COMMON_REGULAR_VERBS.includes(firstWord)) {
    // Starts with unconjugated regular verb
    message = errorMessages.WRONG_GRAMMAR_ADD_S;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text.slice(
        0,
        firstWord.length
      )}s${text.slice(firstWord.length)}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  } else if (COMMON_IRREGULAR_VERBS[firstWord]) {
    // Starts with unconjugated irregular verb
    message = errorMessages.WRONG_GRAMMAR;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${
        COMMON_IRREGULAR_VERBS[firstWord]
      }${text.slice(firstWord.length)}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  } else if (noVagueVerbs && VAGUE_VERBS.includes(firstWord)) {
    // Starts with vague verb
    message = errorMessages.VAGUE_START;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text
        .slice(firstWord.length)
        .trim()}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  } else if (firstWord === "when" || firstWord === "if") {
    // Invalid starting word
    message = errorMessages.INVALID_START_OF_DESCRIPTION;
  } else if (firstWord === "it") {
    // Starts with redundant "it"
    message = errorMessages.DUPLICATED_IT;
    fix = (fixer) => {
      newDescription = `${stringDelimiter}${text
        .slice(firstWord.length)
        .trim()}${stringDelimiter}`;
      return fixer.replaceText(node, newDescription);
    };
  } else if (firstWord === "not") {
    // This rule is added for the autofix (run recursively)
    // "should not create" --> "not create" --> "does not create"
    message = errorMessages.INVALID_START_OF_DESCRIPTION;
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
  } else if (preferWhenToIf) {
    //
    const contextRegex = /(.+ )if( .+)/;
    const match = contextRegex.exec(text);
    if (match) {
      const [, assertion, context] = match;
      message = errorMessages.USE_OF_IF_INSTEAD_OF_WHEN;
      errorStartIndex = errorStartIndex + assertion.length;
      errorEndIndex = errorStartIndex + 2;
      fix = (fixer) => {
        newDescription = `${stringDelimiter}${assertion}when${context}${stringDelimiter}`;
        return fixer.replaceText(node, newDescription);
      };
    }
  }

  return {
    message,
    startIndex: errorStartIndex,
    endIndex: errorEndIndex,
    fix,
  };
}
