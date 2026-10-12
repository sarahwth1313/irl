# Project Guidance

## User Preferences

- App name is IRL, always written in caps
- One-page website
- Bangalore-focused
- Includes a web chat
- Third-party chat widget scripts belong in the HTML head
- Board entries come from the attached IRL spreadsheet

## Verified Commands

- **typecheck**: `pnpm --dir src/frontend typecheck`
- **fix**: `pnpm --dir src/frontend fix`
- **build**: `pnpm --dir src/frontend build`

## Learnings

- Third-party chat widget scripts (Botpress loader + deferred config) belong in src/frontend/index.html <head>; Vite copies head scripts verbatim into dist/index.html.
- The frontend check sequence runs with workdir src/frontend: pnpm typecheck && pnpm fix && pnpm build; the root `pnpm --dir app test` runs the Vitest lane.
- caffeine check --fix runs biome over src and fails on lint errors, including unused interfaces in test files.
- The backend domain logic is stubbed with Debug.todo(), so listMessages/listItems trap with IC0503 at runtime until implemented.
- Motoko has no triple-quoted multiline string literal; author a long Text as a [Text] array of lines joined with "\n".
- Time.now() returns Int; convert with .toNat() for Nat timestamp fields.
- caffeineai-oql 0.8.0 is needed for ?T entity fields; variant fields use .toEntityManual with a .payload mapping.
- The board is the EventsSection in src/frontend/src/App.tsx (id='events'); it is a flat directory board of Bangalore events/places/food/culture, not a kanban.
- The backend Item carries the full spreadsheet field set: activityId, startDate, startTime, endDate, price, ageRequirements, address, registrationLink, mapsLink, sourceLink, lastVerified, status, tags ([Text]); all new fields are optional except tags.
- The board is seeded with 20 entries (CB001–CB020) from migration 00000002; the seed is inlined in the migration because a migration file may not import a project module.
- Migration files must be self-contained (only mo:core and mops package imports) and each migration's OldActor must equal the previous migration's NewActor.
- Migration and seed module files must not bind non-static expressions at module level: Principal.fromText at module level fails with M0014; move it inside the function.
- Map.map over a Map with a record transform needs explicit type instantiation <K, OldV, NewV> when V2 cannot be inferred.
- Board filter/search/sort state is URL-synced via window.history.replaceState in src/frontend/src/hooks/use-board-filters.ts; the app has no router.
- The frontend Item type mirrors the extended backend Item; test fixtures must include the required tags field.
- pnpm bindgen regenerates src/frontend/src/backend.d.ts from src/backend/dist/backend.did; never hand-edit backend.d.ts or backend.ts.
