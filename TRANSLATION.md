# Translating Cipher Lab

Cipher Lab speaks English (`en`, the default) and Polish (`pl`). All user-visible text lives in two files:

- [`messages/en.json`](messages/en.json)
- [`messages/pl.json`](messages/pl.json)

Components never contain UI text; they ask for a message by key through `next-intl`. This covers navigation, buttons, form labels and placeholders, validation and error messages, toasts, empty states, dialogs, cipher descriptions, badge names and descriptions, the footer and the SEO titles and descriptions.

## Adding a new text

1. Choose a key in the matching section (`nav`, `solver`, `play`, …) and add it to **both** files with the same key.
2. Use it in the component:

   ```tsx
   const t = useTranslations('solver'); // or `await getTranslations('solver')` in a server component
   <Button>{t('analyze')}</Button>;
   ```

3. Run `npm test`. The tests fail if the two files differ in keys or in placeholders, and `npm run typecheck` fails if a component uses a key that does not exist.

## Rules

- **Variables and plurals use ICU MessageFormat.** Never build a sentence by joining strings.

  ```json
  "solvedIn": "Solved in {seconds, plural, one {# second} other {# seconds}}"
  ```

  Polish needs more forms; write all that apply (`one`, `few`, `many`, `other`):

  ```json
  "attempts": "{count, plural, one {# próba} few {# próby} many {# prób} other {# próby}}"
  ```

- **Keep the same placeholders** (`{count}`, `{username}`, …) in every language. Placeholder names are not translated.
- **Do not translate proper names:** Cipher Lab, Caesar, ROT13, Atbash, Base64, Base32, Hex, Binary, Morse, A1Z26, Vigenère, XOR.
- **Be consistent.** Use the same word for the same concept everywhere: _puzzle_ → _zagadka_, _solver_ → _solver_ (navigation) / _łamacz szyfrów_ (page title), _hint_ → _podpowiedź_, _badge_ → _odznaka_, _leaderboard_ → _ranking_, _streak_ → _seria_.
- **Natural, not literal.** Polish should read like it was written in Polish; reorder and rephrase when needed.
- Keep technical details out of error messages.

## Texts written by users

Puzzle titles, descriptions, explanations and hints are written by users and stored in the database (`puzzle_translations`), not in these files. A puzzle may have an English and a Polish version; when the requested one is missing, the original is shown with a note ("Available only in Polish").

## Adding a new language

1. Add the code to `locales` in [`src/i18n/routing.ts`](src/i18n/routing.ts).
2. Copy `messages/en.json` to `messages/<code>.json` and translate it.
3. Add the language name (in that language) to `language.names` in **every** file.
4. Add the language to `OG_LOCALE` in [`src/lib/seo.ts`](src/lib/seo.ts) and to the `localeSchema` and `PuzzleListQuery` in `src/lib/validation/puzzle.ts`.
5. Review the places that name `en` and `pl` explicitly (`puzzles.card.onlyIn`, `create.translation.add`, `play.onlyIn`).
6. Run `npm test` and `npm run typecheck`.

## Reporting a translation problem

Open an issue (use the _Bug report_ template) with the language, where you saw the text, what it says now and what it should say. Even better: send a pull request that edits the JSON file directly — small fixes are very welcome.
