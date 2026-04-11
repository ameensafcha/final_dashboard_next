# Pitfalls Research - ERP Auth System

**Researched:** 2025-04-11

## Pitfalls to Avoid

| Pitfall | Warning Signs | Prevention |
|---------|---------------|-------------|
| Hardcoded role checks | "isAdmin === true" in multiple places | Use permission-based checks everywhere |
| Permission caching issues | Users see old permissions after admin changes | Use proper cache invalidation or request-time fetch |
| Breaking existing auth | Removing auth breaks login flow | Keep Supabase Auth integration, only refactor permission layer |
| Sidebar breaking on no permissions | Empty sidebar or errors | Show at least Dashboard for all authenticated users |
| Role deletion breaks employees | Deleting role orphans employees | Use onDelete: SetNull in schema (already done) |

## Phase Mapping

- Phase 1 (Auth Cleanup): Address hardcoded role checks
- Phase 2 (Admin Panel): Address permission management UI
- Phase 3 (Sidebar): Address dynamic menu and caching

---
*Pitfalls research complete*