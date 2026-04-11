# Phase 2: Auth Middleware & Protection - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Middleware redirects unauthenticated users to login, API routes return 401. User wants to DELETE auth-rbac.ts and permissions.ts files as part of auth redesign.

</domain>

<decisions>
## Implementation Decisions

### Files to delete
- **D-01:** Delete `src/lib/auth-rbac.ts` - contains hardcoded role checks
- **D-02:** Delete `src/lib/permissions.ts` - permissions fetching to be redesigned

### Middleware behavior (existing - will verify)
- Redirects unauthenticated users to /login
- Returns 401 JSON for unauthorized API routes
- Uses Supabase cookies for session validation

### Keep for now
- Keep `src/lib/auth-helper.ts` - core session handling
- Keep `src/middleware.ts` - route protection

</decisions>

<canonical_refs>
## Canonical References

### Auth
- `src/middleware.ts` — Route protection and redirect logic
- `src/lib/auth-helper.ts` — Session handling via.Supabase cache

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

  national
## Existing Code Insights

### Already implemented
- Middleware redirects to /login for unauthenticated users
- API routes return 401 for unauthorized access
- Supabase cookies handle session

### Will be deleted
- auth-rbac.ts: has hardcoded role = 'admin' checks
- permissions.ts: DB permission fetching (to be redesigned in Phase 4-5)

</specifics>

<deferred>
## Deferred Ideas

Fresh permissions system redesign will happen in Phase 4-5 (permissions management).

</deferred>

---

*Phase: 02-auth-middleware-protection*
*Context gathered: 2025-04-11*