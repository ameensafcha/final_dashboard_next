# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Status:** No test framework currently configured.

The codebase has **no test files** and no test runner configured. According to AGENTS.md:
> **No test framework is currently configured.** If adding tests, use Vitest for React/Next.js.

**Recommended:**
- Runner: Vitest
- Assertion Library: Built into Vitest
- React Testing: @testing-library/react

## Test File Organization

**Location:** Not established - no existing tests to reference.

**Recommended Pattern (if following AGENTS.md):**
- Unit tests co-located with source files: `src/lib/utils.test.ts`
- Integration tests in `__tests__/` directory or `tests/` at project root

**Naming:**
- `*.test.ts` or `*.test.tsx` for unit tests
- `*.spec.ts` or `*.spec.tsx` as alternative
- `*.integration.ts` for integration tests

## Test Structure

**Not applicable** - no existing test files to analyze patterns.

## Mocking

**Not applicable** - no existing test files to analyze mocking patterns.

**Expected Patterns (based on codebase architecture):**
- Mock Prisma client for database tests
- Mock Supabase client for auth tests
- Mock React Query with query client
- Use MSW (Mock Service Worker) for API route tests

## Fixtures and Factories

**Not applicable** - no existing test files to analyze fixtures.

**Expected Patterns:**
- Create factory functions for test data
- Store fixtures in `__fixtures__/` or `fixtures/` directory
- Use type-safe fixture builders

## Coverage

**Status:** No coverage requirements enforced.

**Recommended:**
```bash
# With Vitest
npx vitest --coverage
```

## Test Types

**Unit Tests:**
- Not implemented
- Recommended: Test individual utilities, components, and functions

**Integration Tests:**
- Not implemented
- Recommended: Test API routes, database operations, auth flows

**E2E Tests:**
- Not implemented
- Could use Playwright or Cypress if needed

## Common Patterns (Expected)

**Async Testing:**
```typescript
// Vitest async testing
test("should create task", async () => {
  const task = await createTask(mockData);
  expect(task.id).toBeDefined();
});
```

**Error Testing:**
```typescript
// Error case testing
test("should throw on missing required field", async () => {
  await expect(createTask({})).rejects.toThrow("Title is required");
});
```

**Component Testing:**
```typescript
// React Testing Library
import { render, screen, fireEvent } from "@testing-library/react";

test("renders task form", () => {
  render(<TaskForm open={true} onClose={fn} />);
  expect(screen.getByText("Create Task")).toBeInTheDocument();
});
```

## Testing Checklist for Future Implementation

If tests are added to this codebase:

1. **Install Vitest:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **Create vitest.config.ts:**
   ```typescript
   import { defineConfig } from "vitest/config";
   
   export default defineConfig({
     test: {
       environment: "jsdom",
       globals: true,
       setupFiles: ["./vitest.setup.ts"],
     },
   });
   ```

3. **Add test scripts to package.json:**
   ```json
   "test": "vitest",
   "test:run": "vitest --run",
   "test:coverage": "vitest --coverage"
   ```

4. **Follow existing conventions:**
   - Use path alias `@/*` for imports
   - Use the same TypeScript strict mode
   - Mock external dependencies (Supabase, Prisma)

---

*Testing analysis: 2026-04-09*
*Note: This codebase currently has zero test files. Testing infrastructure needs to be set up if tests are required.*