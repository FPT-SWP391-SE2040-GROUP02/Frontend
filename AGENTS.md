# LegacyVault frontend instructions

The workspace charter in [../AGENTS.md](../AGENTS.md), the [LegacyVault profile](../docs/LEGACYVAULT_PROFILE.md), and direct user instructions take precedence. This file supplies frontend details when the client repository is shared independently. Include the charter/profile when handing off the repository; do not assume they are tracked by client Git.

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
- Use APP_MESSAGES for shared/API messages, HTTP_STATUS, status constants and ENV.API_BASE_URL. Feature content may live with its feature; obvious one-off literals do not require constants. Document public exports, contracts and non-obvious invariants; avoid comments that only repeat the code.
- No optimistic legal decisions, check-in, handover, identity verification or payment. After a confirmed server result, synchronize the relevant cache by invalidating, updating from the response or clearing it as appropriate.

## Auth, permissions and previews

- User decision on 14/10/2026 selects the official Backend hybrid contract: access JWT in JSON, RAM-only Bearer helper, refresh token in HttpOnly cookie. Never read refresh cookies or persist auth tokens in Web Storage. Use sessionAuthService with the official Backend raw DTO schemas; session cache and Redux hold public user data only. Coordinate cookie mutations in-tab and across tabs before refresh; do not enable blind automatic 401 retries. Cookie-changing auth POSTs require fresh identity-bound antiforgery proof. Never persist private keys, seed phrases, passwords or decrypted sensitive data in Web Storage/cookies, or log them.
- ADMIN is not an automatic owner/executor/verifier and never bypasses allowedRoles. UI guards do not replace BE authorization.
- Fixtures are limited to declared development preview routes. Never fabricate successful authentication, payment, activation, upload or cryptographic verification.
- Keep unconfirmed business integration as an explicit TODO blueprint. Do not infer API contracts from fixture types.
- The current integration guide retires the old FE Shamir/client-encryption flow. Reconcile the applicable SRS/charter before implementing crypto; Base64 is not encryption.

## AI collaboration and Git

- AI supplies scaffolds, contracts, UI, validation and tests; the developer owns business/crypto/submit logic unless directly authorized otherwise.
- Every business TODO includes goal, input/output, sequential steps, functions/libraries, and edge cases/errors.
- Never truncate file content in supplied full-file examples. Reuse approved/native APIs before adding dependencies.
- Follow Conventional Commits and the assigned Jira key; never invent a Jira identifier. A missing key does not block local edits/checks; obtain the real key or an explicit exception before committing. Feature branches originate from develop; do not push directly to main/develop. Commit/push/merge require authorization within the task.
- Use checkpoints for coherent, reviewable changes; 2–3 files are a scope signal, not a hard limit. Do not stop merely to wait for a manual commit: provide commands and continue authorized local work. Stop only for an explicit pause, a required unresolved decision, an action outside authorization or inability to proceed safely. Do not discard user edits.
- For code changes run type-check, lint, architecture checks, relevant tests, format check and build. For documentation-only changes check content, links and diff; no unrelated rebuild is required. Keep dependency lockfiles aligned.
- Husky runs type-check and lint-staged before commit; CI checks the full frontend on pull requests.
- Put project documents in ../docs, outside client, as requested by the user. Keep .env, dependencies, build output, caches, local snapshots and archives out of Git.
