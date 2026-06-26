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

### `tests/integration` — fixture-based integration tests

**No coverage threshold.** These tests exercise the full pipeline — real HA entity states through translation into domain models, then through the insight engine — using JSON fixtures captured from a live system.

Fixture files live under `tests/integration/fixtures/`:

```
tests/integration/fixtures/
  snapshot/   ← single-point-in-time scenarios
  event/      ← before/after pairs for event detection
```

Tests driven by these fixtures:

| Test file | What it verifies |
|---|---|
| `snapshot.test.ts` | `translateEnergySnapshot()` produces the correct domain model for each fixture |
| `insight.test.ts` | `describeEnergyState()` produces the correct type, sentiment, and title |
| `event.test.ts` | `detectEvents()` emits the right events (pending implementation) |

---

## Fixture format

Each fixture is a self-contained JSON file:

```json
{
  "schemaVersion": 1,
  "id": "battery-charging-solar",
  "description": "Human-readable summary of the scenario.",
  "capturedAt": "2025-06-01T12:30:00Z",
  "metadata": {
    "provider": "LuxPower",
    "weather": "Sunny",
    "notes": "Optional free-text context for future readers."
  },
  "entities": {
    "sensor.pv_power": { "state": "3600", "attributes": {} }
  },
  "mapping": { "solarPower": "sensor.pv_power", "currency": "GBP" },
  "expected": {
    "snapshot": { "solar": { "generatingWatts": 3600, "isGenerating": true } },
    "insight":  { "type": "battery_charging_solar", "sentiment": "positive", "title": "Charging from Solar" }
  }
}
```

**`schemaVersion`** — must equal `1`. The test helper rejects fixtures with an unsupported version, so future format changes can be introduced without silently misinterpreting older files.

**`metadata`** — ignored by tests; purely for documentation. Record anything that helps a reader understand the scenario months later.

**`expected.insight`** — asserts only `type`, `sentiment`, and `title`. Description strings are intentionally excluded so wording can be improved without breaking tests.

---

## Fixture IDs are permanent

The `id` field is the stable identity of a scenario. **Never rename an `id` once it has been committed** unless the underlying scenario has materially changed. IDs appear in test failure messages and historical references; changing them breaks that continuity.

If a scenario needs to be updated (e.g. sensor values corrected), update the fixture in place and keep the same `id`. If a genuinely new scenario is needed, create a new fixture with a new `id`.

---

## Adding a new fixture

1. Open **Home Assistant → Developer Tools → States** and locate the relevant entities.
2. Create a new JSON file under `tests/integration/fixtures/snapshot/` (or `event/` for a transition scenario).
3. Fill in `entities` and `mapping` from the live state values.
4. Write the `expected` section based on what you know the values should produce.
5. Run `pnpm --filter @cardinal/integration-tests test` to confirm the fixture passes.
6. Commit the fixture file. No other code changes are required — the tests discover fixtures by directory glob.

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
pnpm --filter @cardinal/integration-tests test
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
