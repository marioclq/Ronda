# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(A PWA, also packaged for Android through Capacitor, whose WebView is Chromium. The design language stays web; it is not a native Android app.)

## Users

- **Friends at a get-together:** 3 to 8 people, usually at night, sometimes drinking. One phone passes from hand to hand or rests on the table, read aloud for the group.
- **Couples on a date:** two people face to face, using the date mode.
- **Couples who are already together:** to get to know each other better, or to raise the tone at home.
- **Other groups:** family, coworkers and similar, mostly on the soft level.

Everyone plays on the same device. There are no accounts and no second screen.

## Product Purpose

A party questions game in Spanish (Verdad o reto, Yo nunca, ¿Qué prefieres?, Lo más probable) on three levels (Suave, Picante, Extremo), plus a date mode built on Aron's 36 questions. It exists so a group can play with one phone and no setup beyond typing names. Success means the conversation at the table keeps going, the cards fit the people playing, and nobody has to hand data to anyone.

## Positioning

- **Local and private:** works offline, no accounts, no ads, and sends no data anywhere (strict CSP, `connect-src 'self'`).
- **Cards that adapt:** they take gender and attraction into account, do not repeat, and record which cards get passed or swapped and why, to improve suggestions.
- **A date mode with a real basis:** Aron's 36 questions, with closeness measured before and after on the IOS scale, plus listening tips.
- **Crafted design:** one app with liquid glass, motion and an atmosphere per level, instead of plain lists.

## Operating Context

- Dim rooms at night, a phone lying on a table and read by several people at arm's length.
- Turn by turn: the phone shows whose turn it is, they pick Verdad, Reto or Al azar, the card appears, and the turn closes with Cumplió or Pasar. A penalty (drinks or a garment) can follow.
- Android may close the app in the background. An unfinished game must come back exactly where it was.
- Date mode is for two people facing each other. Past dates stay hidden on purpose: they are seen only in Ajustes → Privacidad, after a confirmation.

## Capabilities and Constraints

- **Content:** about 1 780 published cards, plus custom cards ("Mis cartas"), export and import of cards, and a full backup.
- **Game actions:** Pasar, Otra carta (with a reason), Deshacer, an in-game menu (add and remove players, change level, end the game), and a countdown with pause for timed dares.
- **Extremo:** needs a +18 confirmation for each game, and its cards load separately.
- **Look:** the glass look is user-tunable in Ajustes → Vidrio. The app supports a light and a dark theme, reduced motion and reduced transparency.
- **Technical:** React 19 + TypeScript; a pure engine in `src/core`; every UI text lives in `src/i18n/es.ts`; no color literals in components; tests (unit tests and Playwright E2E) select UI elements by `data-testid`.
- **Language:** Spanish only, in a neutral accent.
- **Undecided:** store publication; any form of online play or sync (currently out of scope).

## Brand Commitments

- **Name:** Ronda. Tagline: "Un teléfono, una mesa."
- **Visual system:** Liquid Glass Nocturne (`Redesign/stitch_liquid_glass_interface_redesign/liquid_glass_nocturne/DESIGN.md`), the owner's own Stitch design. Binding: a midnight-violet base, one accent per level (Suave `#FF8C53`, Picante `#D92688`, Extremo `#E6194B`) and Inter at heavy weights.

## Evidence on Hand

- **Real content:** the card decks in `content/`, the 36 questions with their sets, and the listening tips.
- **Screenshots:** in `capturas/`.
- **Absences:** there are no user counts, ratings, testimonials, scores or community features, and none may be invented. Stitch placeholders like "120.000 rondas" or "98% atrevidos" were rejected for this reason.

## Product Principles

1. **The table comes first.** Everything must read at arm's length in a dark room and work with one hand passing the phone.
2. **Nothing leaves the phone.** Privacy is a feature, not a setting.
3. **Never stall the game.** Every state has a way forward (pass, swap, undo, skip), and an interruption never loses the game.
4. **Fit the people playing.** Cards respect who is attracted to whom, the level chosen and what the group keeps refusing.
5. **Consent before intensity.** Extremo, and the date mode's agreement, ask first.

## Accessibility & Inclusion

- **Respect system settings:** reduced motion and reduced transparency, plus an in-app switch for reduced transparency.
- **Text contrast:** at least 4.5:1 over glass in both themes.
- **Inclusive player options:** gender and attraction both accept "Prefiero no decir"; gender also accepts "Otro", and attraction accepts "Todos".
