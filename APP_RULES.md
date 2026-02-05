# App Rules

## Types and Interfaces

- All TypeScript `type` aliases and `interface` definitions must live in:
  - `server/types/types.ts` (server-only types)
  - `src/types/clientTypes.ts` (client-only types)
  - A dedicated shared types file (src/types/sharedTypes.ts)

- Do **not** define `type`/`interface` inside React components (e.g. `src/components/*.tsx`).

- Server and client types must remain separated:
  - Server code must not import from `src/*`
  - Client code must not import from `server/*`
