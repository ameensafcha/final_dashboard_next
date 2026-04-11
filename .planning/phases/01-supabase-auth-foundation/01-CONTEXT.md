# Phase 1: Supabase Auth Foundation - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

User login/logout with email/password via Supabase Auth, session persistence across browser refresh. This phase covers existing login form, auth context, logout API - verifying existing implementation works correctly.

</domain>

<decisions>
## Implementation Decisions

### Authentication already exists
- Login form at `src/app/login/page.tsx` — uses `useAuth` context
- Auth context at `src/contexts/auth-context.tsx` — provides login/logout functions
- Logout API at `src/app/api/auth/logout/route.ts` — handles server-side logout
- Session handled via Supabase's built-in caching in `getCurrentUser`

### the agent's Discretion
- Exact session timeout configuration — Supabase handles this
- Post-login redirect behavior (logged in → dashboard)
- Exact error messages shown on login failure

</decisions>

<canonical_refs>
## Canonical References

### Authentication
- `src/app/login/page.tsx` — Login form UI
- `src/contexts/auth-context.tsx` — Auth context with login/logout
- `src/lib/auth-helper.ts` — Server-side session handling with cache

### Supabase Auth
- Supabase docs: https://supabase.com/docs/guides/auth/server-side-rendering

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

  national
## Existing Code Insights

### Reusable Assets
- Login form already implemented with email/password
- AuthProvider wraps the app with context
- Logout button in sidebar uses the logout function

### Established Patterns
- Uses useAuth hook for client-side auth
- getCurrentUser uses React cache for server-side
- Redirects non-logged-in users middleware

### Integration Points
- Login form connects to auth-context login function
- Sidebar logout button calls logout()
- Middleware redirects to /login

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Existing code uses Supabase Auth standard patterns.

</specifics>

<deferred>
## Deferred Ideas

None — login/logout already implemented in existing code.

</deferred>

---

*Phase: 01-supabase-auth-foundation*
*Context gathered: 2025-04-11*