# LegacyVault frontend instructions

The workspace charter in ../AGENTS.md and direct user instructions take precedence. This file applies to the client repository when shared independently.

## Architecture and contracts

- Use one-way FSD imports: app → pages → widgets → features → entities → shared. Never import across feature slices.
- Pages assemble widgets/features. Keep form state, validation and actions in the owning feature. Widgets compose features.
- Introduce types/Zod schemas, services, TanStack Query hooks, then UI, in that order.
- Keep DTO JSON field names unchanged. Confirm real backend DTOs/endpoints before integrating; an architecture/work allocation document does not prove implementation.
- apiClient/axiosClient returns the entire HTTP body after its response interceptor. Declare the second Axios generic as the body type. A backend envelope's data field is unwrapped explicitly by its service, once.
- Use createBaseService for confirmed CRUD contracts. A custom Axios instance supplied to it must return HTTP bodies too. Override endpoint-specific envelopes/verbs.
- Keep backend DTO → ViewModel adapters with the owning entity. Form → request mapping stays with its feature.

## State, validation and UI

- Enable TypeScript strict; never use any, @ts-ignore or @ts-nocheck. Narrow unknown input at trust boundaries.
- Use TanStack Query for server state, RHF/Zod for form state, URL search params for filters/tabs, and Redux for global client state.
- Validate on blur and revalidate on blur. Use useWatch for field subscriptions. Disable pending actions and prevent duplicate submission.
- Cover loading, error with retry, empty and success states. Do not replace API errors or empty results with mock data.
- Use shared UI, semantic controls, accessible names/errors, focus trapping and Escape for dialogs. Respect the Heritage design tokens.
- Use APP_MESSAGES, HTTP_STATUS, status constants and ENV.API_BASE_URL. Add TSDoc to new exported types, functions, hooks and components.
- No optimistic legal decisions, check-in, handover, identity verification or payment. Invalidate the relevant cache only after a confirmed server result.

## Auth, permissions and previews

- Access tokens live only in RAM. Refresh cookies belong to BE. Never persist tokens, private keys, seed phrases, passwords or plaintext to Web Storage/cookies, or log them.
- ADMIN is not an automatic owner/executor/verifier and never bypasses allowedRoles. UI guards do not replace BE authorization.
- Fixtures are limited to declared development preview routes. Never fabricate successful authentication, payment, activation, upload or cryptographic verification.
- Keep unconfirmed business integration as an explicit TODO blueprint. Do not infer API contracts from fixture types.
- The current integration guide retires the old FE Shamir/client-encryption flow. Reconcile the applicable SRS/charter before implementing crypto; Base64 is not encryption.

## AI collaboration and Git

- AI supplies scaffolds, contracts, UI, validation and tests; the developer owns business/crypto/submit logic unless directly authorized otherwise.
- Every business TODO includes goal, input/output, sequential steps, functions/libraries, and edge cases/errors.
- Never truncate file content in supplied full-file examples. Reuse approved/native APIs before adding dependencies.
- Follow Conventional Commits and the assigned Jira key; never invent a Jira identifier. Feature branches originate from develop; do not push directly to main/develop.
- Work in 2–3-file checkpoints unless the user explicitly asks for a single combined pass. Do not discard user edits.
- Before completion run type-check, lint, architecture checks, relevant tests, format check and build. Keep dependency lockfiles aligned.
- Husky runs type-check and lint-staged before commit; CI checks the full frontend on pull requests.
- Put project documents in ../docs, outside client, as requested by the user. Keep .env, dependencies, build output, caches, local snapshots and archives out of Git.
