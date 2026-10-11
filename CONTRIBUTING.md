# Contributing to Cipher Lab

[Polski](CONTRIBUTING.pl.md) · English

Thanks for wanting to help! Bug reports, new ciphers, translation fixes, documentation and code are all welcome. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug or suggest a feature** with the issue templates.
- **Fix a translation** — see [TRANSLATION.md](TRANSLATION.md). No coding needed beyond editing JSON.
- **Add a cipher** — see "Adding your own cipher" in the [README](README.md#adding-your-own-cipher).
- **Improve code or docs** — open a pull request.

For larger changes, open an issue first so we can agree on the approach.

## Development setup

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run dev
```

## Before you open a pull request

Run everything CI runs and make sure it passes:

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
```

## Guidelines

- Keep cipher logic in `src/lib/ciphers` independent from the UI.
- Never write user-visible text inside components. Add it to **both** `messages/en.json` and `messages/pl.json`; the tests check that the two files have the same keys and placeholders.
- Use ICU plurals for counts (`{count, plural, one {…} other {…}}`); do not build sentences by concatenating strings.
- Validate all API input with Zod and return errors in the common `{ ok, data | error }` format, without technical details.
- Add or update tests for the behavior you change. Ciphers need a round-trip test and a known test vector.
- Do not commit secrets or database files.
- Keep pull requests focused, with a short description of what and why.

## Commit messages

Short, imperative subject line (for example `Add Playfair cipher`), with details in the body if needed.
