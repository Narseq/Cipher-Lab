# Współtworzenie Cipher Lab

Polski · [English](CONTRIBUTING.md)

Dziękujemy za chęć pomocy! Mile widziane są zgłoszenia błędów, nowe szyfry, poprawki tłumaczeń, dokumentacja i kod. Przestrzegaj [Kodeksu postępowania](CODE_OF_CONDUCT.pl.md).

## Jak możesz pomóc

- **Zgłoś błąd lub zaproponuj funkcję** przez szablony zgłoszeń.
- **Popraw tłumaczenie** — zobacz [TRANSLATION.md](TRANSLATION.md). Wystarczy edycja plików JSON.
- **Dodaj szyfr** — zobacz „Dodawanie własnego szyfru" w [README.pl.md](README.pl.md#dodawanie-własnego-szyfru).
- **Ulepsz kod lub dokumentację** — otwórz pull request.

Przy większych zmianach najpierw otwórz zgłoszenie (issue), żebyśmy uzgodnili podejście.

## Środowisko deweloperskie

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run dev
```

## Zanim otworzysz pull request

Uruchom wszystko, co uruchamia CI, i upewnij się, że przechodzi:

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
```

## Zasady

- Logika szyfrów w `src/lib/ciphers` ma być niezależna od interfejsu.
- Nigdy nie wpisuj tekstu widocznego dla użytkownika w komponentach. Dodaj go do **obu** plików `messages/en.json` i `messages/pl.json`; testy sprawdzają, czy mają te same klucze i placeholdery.
- Do liczebników używaj wielu form ICU (`{count, plural, one {…} other {…}}`); nie sklejaj zdań ze stringów.
- Waliduj wszystkie dane wejściowe API przez Zod i zwracaj błędy we wspólnym formacie `{ ok, data | error }`, bez szczegółów technicznych.
- Dodaj lub zaktualizuj testy zmienianej funkcjonalności. Szyfry wymagają testu odszyfrowania po zaszyfrowaniu i znanego wektora testowego.
- Nie commituj sekretów ani plików bazy danych.
- Pull requesty powinny być skupione na jednym temacie, z krótkim opisem, co i dlaczego.

## Komunikaty commitów

Krótki temat w trybie rozkazującym (np. `Add Playfair cipher`), a szczegóły w treści, jeśli trzeba.
