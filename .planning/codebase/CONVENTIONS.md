# Coding Conventions

**Analysis Date:** 2026-04-10

## Naming Patterns

**Files:**
- Page: `page.tsx` (Next.js convention)
- API: `route.ts`
- Components: kebab-case (e.g., `task-board.tsx`)
- Utilities: kebab-case (e.g., `auth-helper.ts`)
- Hooks: `use-*` prefix

**Code:**
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- React components: PascalCase
- Types: PascalCase

## Import Order

1. React/Next.js imports
2. Third-party libraries
3. Internal `@/` imports
4. UI/component imports
5. Utility imports

Path alias: `@/*` → `./src/*`

## Error Handling

API routes:
```typescript
try {
  const user = await getCurrentUser();
  if (!user) return authResponse("Unauthorized");
  return NextResponse.json(result);
} catch (error) {
  console.error('[API]', error);
  return NextResponse.json({ error: 'Message' }, { status: 500 });
}
```

---

*Convention analysis: 2026-04-10*