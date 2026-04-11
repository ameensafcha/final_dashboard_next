# CONCERNS - Technical Debt & Issues

## Known Issues

### Orphaned Files
- `src/app/production/page.tsx` - Referenced in build but not moved to new structure
- LSP shows errors for this file (module not found)

### Incomplete Feature
- Packing logs pages at `/packing-logs` and `/packing-receives` - not under production module
- Should be `/production/packing-logs` and `/production/packing-receives`

## Technical Debt

### Middleware
- Currently only checks auth, doesn't check permissions at edge level
- Role-based route protection relies on client-side + API guards more than middleware

### Data Fetching
- Mix of Server Components (direct Prisma) and Client Components (React Query)
- Could standardize on one approach

### Role Permissions
- `requirePermissionApi` and `requireAdminApi` exist but not applied to all API routes
- Need to audit which routes are missing permission guards

## Security Considerations

- No rate limiting on API routes
- No input sanitization beyond Prisma parameterization

## Build Warnings

- ESLint shows errors in `.opencode/get-shit-done/bin/` - tool scripts using require()
- Not in user code, but may want to exclude that directory

---

*Concerns documented: 2026-04-11*