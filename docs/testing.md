# Testing

## Philosophy

Tests in Cardinal exist to catch regressions, communicate intent, and give contributors confidence to change code. They are not a compliance exercise.

**Testing is part of the definition of done.** A feature is not complete until its tests are written and passing. A bug fix is not complete until a test exists that would have caught it.

---

## Principles

**Test behaviour, not implementation.**
Tests describe what a function or component does, not how it does it internally. If a refactor breaks a test without changing observable behaviour, the test was wrong.

**Pure functions first.**
Business logic in `packages/core` is pure TypeScript. Unit tests for pure functions are fast, deterministic, and require no mocking. These tests should be comprehensive.

**Providers test translation, not the network.**
The HA WebSocket connection is not mocked at the class level. Instead, the translation functions in `packages/providers` are tested directly with fixed input data. Integration tests that exercise the WebSocket subscription are a future addition.

**Components test rendering and interaction, not business logic.**
Vue components should contain no calculations or derivations. Component tests verify that a component renders the right content given its inputs — they do not re-test logic that belongs in core.

**Every bug gets a regression test.**
When a bug is found, a failing test is written before the fix is applied. The test documents the broken behaviour and permanently prevents regression.

---

## Layers and Responsibilities

### `packages/domain`

Domain models are TypeScript interfaces with no runtime code. There is nothing to unit test here.

Tests will be added when runtime validators, factory functions, or predicates are introduced into the package.

### `packages/core`

**Coverage goal: 90% lines, 85% branches.**

All exported functions are pure and should be comprehensively tested. Test files live alongside the source:

```
packages/core/src/
  energy.ts
  energy.test.ts
  summary.ts
  summary.test.ts
```

Tests cover:
- Normal inputs with expected outputs
- Zero values and boundary conditions
- All branches of conditional logic

### `packages/providers`

**Coverage goal: 85% lines, 80% branches.**

The `translate.ts` module is the most critical part of the provider layer — it is where HA entity data is mapped into Cardinal domain models. Test it directly with mock `HassState` objects.

`HassEnergyProvider` depends on a live WebSocket connection and is not covered by unit tests. Integration tests for the provider class are a future addition.

```
packages/providers/src/hass/
  translate.ts
  translate.test.ts
```

Tests cover:
- Both sensor conventions (single signed sensor, separate sensors)
- All entity types: solar, battery (charge + discharge + SOC), grid (import + export), home
- Graceful handling of unavailable, unknown, and NaN states
- Missing entity mappings (entity ID not configured)

### `packages/ui`

**Coverage goal: 70% lines.**

Component tests use `@vue/test-utils` with a jsdom environment. Tests verify:
- Components render correctly given props and store state
- User interactions trigger the expected behaviour
- Components do not contain or re-test business logic

No component tests exist yet. They will be added as components are built.

### `apps/frontend` — Pinia stores

**Coverage goal: 80% lines, 75% branches.**

Pinia stores are tested directly without rendering Vue components. Tests verify:
- Initial state is correct
- State updates correctly when setters are called
- Computed values (getters) derive correctly from state

---

## Running Tests

### All packages

```bash
pnpm test
```

### Single package

```bash
pnpm --filter @cardinal/core test
pnpm --filter @cardinal/providers test
pnpm --filter @cardinal/frontend test
```

### With coverage

```bash
pnpm --filter @cardinal/core coverage
```

### Watch mode (during development)

```bash
pnpm --filter @cardinal/core exec vitest
```

---

## Coverage

Coverage is measured with `@vitest/coverage-v8`. Reports are written to `coverage/` in each package.

Coverage thresholds are enforced in CI and will fail the build if not met.

| Package | Lines | Branches | Notes |
|---|---|---|---|
| `@cardinal/core` | 90% | 85% | Pure functions; all branches testable |
| `@cardinal/providers` | 85% | 80% | Translation logic; provider class excluded |
| `@cardinal/ui` | 70% | — | Added as components are built |
| `apps/frontend` stores | 80% | 75% | Store wiring and computed state |

---

## Conventions

- Test files live next to the source file they test: `foo.ts` → `foo.test.ts`
- Describe blocks group related behaviour: `describe('calculateImportCost', () => { ... })`
- Test names describe the expected behaviour, not the implementation: `'returns zero when nothing was imported'`
- Fixtures and builders are shared within a test file; shared helpers go in `src/__tests__/helpers.ts`
- Do not test TypeScript types — the compiler handles that
- Do not assert on generated IDs or timestamps unless testing the generation itself
