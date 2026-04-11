# CONCERNS - Technical Debt & Issues

## Known Issues

### Orphaned File
- `src/app/production/page.tsx` - Referenced in build but not in new structure
- LSP shows errors for this file (module not found)

### Permission List Hardcoded (In Progress)
- `src/lib/permissions.ts` - Permission list hardcoded, not from DB
- Should fetch available permissions from `role_permissions` table
- Plan to fix: Create `/api/permissions` endpoint to fetch from DB

### Incomplete Module Restructuring
- `/packing-logs` and `/packing-receives` - Not under production module
- Should be `/production/packing-logs` and `/production/packing-receives`

## Technical Debt

### Middleware
- Only checks auth, doesn't check detailed permissions at edge
- Role-based route protection relies on client-side + API guards

### Data Fetching
- Mix of Server Components (direct Prisma) and Client Components (React Query)
- Could standardize on one approach

### Missing API Guards
- Not all API routes have `requirePermissionApi()` applied
- Should audit and add guards to all relevant routes

## Security Considerations

- No rate limiting on API routes
- No input sanitization beyond Prisma parameterization

## Build Warnings

- ESLint shows errors in `.opencode/get-shit-done/bin/` - tool scripts using require()
- Not in user code - can ignore or exclude

---

*Concerns documented: 2026-04-11*