# App Rules

## General

- Do not remove functional blocks without approval

## Types and Interfaces

- All TypeScript `type` aliases and `interface` definitions must live in:
  - `server/types/types.ts` (server-only types)
  - `src/types/clientTypes.ts` (client-only types)
  - A dedicated shared types file (src/types/sharedTypes.ts)

- Do **not** define `type`/`interface` inside React components (e.g. `src/components/*.tsx`).

## Server and Client Code Separation

- Server and client types must remain separated:
  - Server code must not import from `src/*`
  - Client code must not import from `server/*`

## Styling

- New styles will use css classes instead of inline styles
- Tailwind CSS will be gradually phased out

## Linting and Formatting

- Use `eslint` for linting and `prettier` for formatting
- Use `eslint.config.js` for configuration
- Use 100 chars per line always for readability
