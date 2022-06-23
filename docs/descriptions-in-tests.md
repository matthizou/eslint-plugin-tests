# descriptions-in-tests

## Intro

In tests, `it` functions are, by convention, often used like that:

```
it('returns the expected result', () => {
 .....
})
```

The first word of the description ("returns" in here) is a verb conjugated with
"it".

It is quite frequent to see developers forgetting about that, yet it is simple
to check.

That's what this little rule does. Just check the first word, nothing less,
nothing more.

---

## Options

- `noVagueVerbs` _[Boolean] Optional_  
  Default: **false**

  Whether the descriptions can start with verbs indicating a probability, such
  as "should", "could", "may".

- `preferWhenToIf` _[Boolean] Optional_  
  Default: **false**

  Prompt the user to change `if` for `when` in the context part of the description, when present.  
  ie: `it('does something if the user clicks on the button', ....`

---

## Rules

- The description shouldn't be empty

- The description shouldn't be more the 100 characters

- The first word of the description should start with a **lower-case** letter

- The first word must be conjugated with "it".  
  This rule can recognize the most often used verbs and whether they are
  conjugated or not.

```js
// ️✔ Good
it('does nothing', () => {})

// Bad - not conjugated
it('do nothing', () => {})

// Bad - capitalized
it('Does nothing', () => {})

// Bad - empty
it('', () => {})

// Bad with option `noVagueVerbs` set to `true`
it('should do nothing but I am not 100% sure', () => {})
```

---

## Notes

- Only descriptions of `it` functions are considered

- 🛠️ This rule has auto-fix for many of the issues it reports 🎉  
  Run eslint with the `--fix` or `--fix-dry-run` option

- 📗 This rule works with a small inner English dictionnary of the most common
  verbs starting descripitions. It would be easy extend it/make it customizable
  with a new option. Let me know if you need it ! 💬
