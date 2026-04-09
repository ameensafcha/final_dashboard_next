# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Runner:**
- Vitest 4.1.4 (configured but no config file found)
- No dedicated vitest.config.ts or vite.config.ts in root
- Likely uses default Vitest configuration

**Assertion Library:**
- Not explicitly installed; likely relies on Node.js assert or Vitest built-ins
- No third-party assertion library detected (no chai, jest-expect, etc.)

**Run Commands:**
```bash
npm run test              # Run all tests (vitest run)
npm run test:watch       # Watch mode (vitest)
```

## Test File Organization

**Location:**
- Currently: No test files found in `src/` directory
- Testing infrastructure present but not utilized
- Recommended location: Co-located with source files (e.g., `TaskForm.test.tsx` next to `TaskForm.tsx`)

**Naming:**
- Convention would follow: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Not currently implemented in codebase

**Structure:**
- No established test directory pattern
- Would typically place tests alongside source files or in a parallel `__tests__` directory per module

## Test Structure

**Suite Organization:**
- No tests currently exist in the codebase
- Pattern observed in third-party dependencies suggests:
```typescript
describe('Feature Name', () => {
  it('should handle specific case', () => {
    // test logic
  });
  
  it('should fail gracefully', () => {
    // error case
  });
});
```

**Patterns:**
- Setup pattern: Not established, but likely uses `beforeEach()` for state initialization
- Teardown pattern: Not established, but likely uses `afterEach()` for cleanup
- Assertion pattern: Would be direct value assertions or mocking library calls

## Mocking

**Framework:**
- No mocking framework explicitly installed
- Vitest has built-in mocking capabilities via `vi.mock()` and `vi.spyOn()`
- Would need to install `@vitest/ui` or MSW (Mock Service Worker) for HTTP mocking if needed

**Patterns:**
- Not yet established in codebase
- Recommended for API routes: Mock Prisma client with `vi.mock('@/lib/prisma')`
- Example pattern would be:
```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employees: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    }
  }
}));
```

**What to Mock:**
- Recommended: Prisma database calls (to avoid database dependencies)
- Recommended: Supabase auth methods in client tests
- Recommended: External API calls
- Recommended: NextResponse for API route testing

**What NOT to Mock:**
- Business logic functions
- Utility functions like `cn()` or date parsing
- Permission/authorization logic (test it integrated if possible)
- Type definitions and interfaces

## Fixtures and Factories

**Test Data:**
- Not currently implemented
- Would be beneficial for creating consistent mock data
- Recommended pattern:
```typescript
const mockEmployee = {
  id: 'emp-123',
  name: 'John Doe',
  email: 'john@example.com',
  role_id: 'role-admin',
  is_active: true,
  role: { name: 'admin' }
};

const mockTask = {
  id: 'task-456',
  title: 'Test Task',
  status: 'not_started',
  priority: 'high',
  assignee_id: 'emp-123',
  due_date: '2026-04-30T00:00:00Z',
  // ...
};
```

**Location:**
- Recommended: `src/__tests__/fixtures/` or `src/__tests__/mocks/`
- Alternative: Keep fixtures in same file as test with `const mocks = {}`
- Pattern: Separate factory functions for creating variants

## Coverage

**Requirements:**
- Not enforced (no coverage threshold in package.json or config)
- No coverage reporting setup

**View Coverage:**
```bash
# Would require vitest.config.ts with coverage enabled
npm run test -- --coverage
```

**Recommended setup:**
- Add to `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
      ]
    }
  }
});
```

## Test Types

**Unit Tests:**
- Should test: Utility functions, permission checks, Zustand stores
- Scope: Individual functions in isolation with mocked dependencies
- Approach: Test pure functions first, then functions with side effects

**Examples to test:**
- `src/lib/auth-helper.ts`: `requireAdmin()`, `requireRole()`, `getCurrentUser()`
- `src/lib/auth-rbac.ts`: `hasRole()`, `hasPermission()`, `checkRoutePermission()`
- `src/lib/stores/ui.ts`: Zustand store actions and selectors
- `src/lib/utils.ts`: `cn()` utility function

**Integration Tests:**
- Should test: API routes with Prisma, auth context with Supabase
- Scope: Multiple components working together
- Approach: Mock Prisma/Supabase but test actual business logic flow

**Examples to test:**
- API routes: `GET /api/auth/role`, `PATCH /api/auth/role`, `POST /api/batches`
- Auth context: Login flow, session refresh, logout
- Permission checks: Role-based access in protected routes

**E2E Tests:**
- Framework: Not currently used
- Recommendation: Consider Playwright or Cypress for user flows
- Not set up in this project

## Common Patterns

**Async Testing:**
- Use `async/await` in test functions
- Return promises from test if not using async
- Example:
```typescript
it('should fetch employee data', async () => {
  vi.mocked(prisma.employees.findUnique).mockResolvedValue(mockEmployee);
  const result = await getCurrentUser();
  expect(result?.id).toBe('emp-123');
});
```

**Error Testing:**
- Test error cases alongside success cases
- Example:
```typescript
it('should return 401 when unauthorized', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  const result = await requireAuth();
  expect(result).toBeInstanceOf(NextResponse);
});

it('should throw specific error message', () => {
  expect(() => {
    throw new Error('Specific message');
  }).toThrow('Specific message');
});
```

**Mutation Testing:**
- Test React Query mutations with `.onSuccess()` and `.onError()` handlers
- Example:
```typescript
it('should call onSuccess callback on successful mutation', async () => {
  const onSuccess = vi.fn();
  const { result } = renderHook(() => 
    useMutation({
      mutationFn: async () => mockTask,
      onSuccess
    })
  );
  
  await act(async () => {
    await result.current.mutate({});
  });
  
  expect(onSuccess).toHaveBeenCalled();
});
```

## Missing Test Configuration

**Needed for full testing capability:**
1. `vitest.config.ts` - Configure test runner, coverage, and environment
2. `@testing-library/react` - For component testing
3. `jsdom` - Already in devDependencies; needed for DOM testing environment
4. Documentation of mock setup patterns

**Current blockers:**
- No test files exist to establish patterns
- Vitest installed but unconfigured
- No mocking libraries installed beyond Vitest built-ins
- JSDOM present but may need configuration in vitest.config.ts

---

*Testing analysis: 2026-04-09*
