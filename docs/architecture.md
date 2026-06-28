# Application Architecture

**Status:** Accepted

---

## Summary

This document records the foundational architectural decisions for Cardinal: its deployment model, monorepo structure, package responsibilities, data flow, and v1 feature scope.

---

## Deployment Model

Cardinal is a **Home Assistant custom integration** distributed through HACS.

The integration is responsible for:

- Registering Cardinal as a frontend panel in Home Assistant
- Serving compiled frontend assets
- Managing configuration via Home Assistant's Config Flow
- Providing future backend services if required

From the user's perspective, Cardinal behaves as a first-party Home Assistant application. It appears in the sidebar, occupies the full viewport, and provides its own navigation and user experience.

**The integration layer should remain as small as possible.** It acts as a bridge between Home Assistant and the frontend. All business logic lives in TypeScript packages.

---

## Architecture Goal

```
Runtime:      Home Assistant Panel
Architecture: Platform-independent
Future:       Portable to standalone web app or mobile without major rewrites
```

The Python integration is a thin runtime host. The TypeScript packages — domain models, business logic, providers, and UI — are written so they can be reused outside of Home Assistant.

---

## Monorepo Structure

```
apps/
  frontend/        Vue/TypeScript panel application
  integration/     Python Home Assistant custom integration

packages/
  core/            Business logic — pure TypeScript functions, no framework dependencies
  domain/          Cardinal domain models (EnergySnapshot, BatteryState, DailySummary, etc.)
  providers/       Data fetching and translation — outputs Cardinal domain models
  ui/              Reusable Vue components
```

### Package Dependency Rules

```
packages/domain     ← no Cardinal dependencies (foundation)
packages/core       ← depends on domain
packages/providers  ← depends on domain
packages/ui         ← depends on domain
apps/frontend       ← depends on core, providers, ui, domain
apps/integration    ← Python only, no TypeScript dependencies
```

No package may introduce a circular dependency. `packages/core` must never depend on `packages/providers` or any Vue package.

---

## Provider Contract

Providers are responsible for:

1. Connecting to the Home Assistant WebSocket API
2. Subscribing to entity state changes
3. Translating raw Home Assistant entities into Cardinal domain models
4. Validating incoming data before passing it upstream

**Providers output Cardinal domain models. They never expose raw Home Assistant entities to the rest of the application.**

`packages/core` must never know what a Home Assistant entity looks like. The HA dependency boundary is the provider.

This ensures the core remains platform-independent and allows future providers (e.g. a mock provider for testing, or a different data source for a standalone app) without changing business logic.

---

## Connection Initialisation

When Home Assistant loads Cardinal as a custom panel, it passes a `hass` object to the panel's root web component. This object contains an authenticated WebSocket connection.

**The Vue application receives `hass` at mount time, extracts the connection, and passes it into the Home Assistant provider during initialisation.**

```
HA Panel → hass object → apps/frontend entry point → HassProvider.connect(hass.connection)
```

From that point, the rest of the application communicates only through Cardinal provider interfaces. The provider has no dependency on Vue or on the panel runtime. This makes it independently testable and reusable.

---

## State Management and Data Flow

### Live data path

```
HassEnergyProvider  →  useEnergyStore  →  useHistoryStore  →  Vue Components
                              ↑                  ↑
                         packages/core      packages/core
                         (pure functions)   (pure functions)
```

1. `HassEnergyProvider` pushes Cardinal domain models into `useEnergyStore` when HA state changes.
2. `useEnergyStore` stores raw live data only: `latestSnapshot`, `latestDailySummary`, `health`, `connectionStatus`. It does not derive insight or financials.
3. `useHistoryStore` reads from `useEnergyStore` and computes: `currentSnapshot`, `currentDailySummary`, `currentInsight`, `currentDailyFinancials`, `currentTime`.
4. Vue components consume `currentSnapshot` and related values from `useHistoryStore`. They never read `latestSnapshot` from `useEnergyStore` directly.

**Business logic must never live inside Vue components.** Components are responsible for presentation only.

### Live and historical data convergence

```
                  useEnergyStore.latestSnapshot
                          │
            ┌─────────────┴──────────────┐
            │ live mode                  │ historical mode
            ▼                            ▼
  useHistoryStore.currentSnapshot ◄── historicalSnapshot (from IHistoricalSnapshotProvider)
            │
            ▼
     Vue Components
  (NowPanel, TodayPanel, etc.)
```

`currentSnapshot` is the single authoritative data source for all components. A component that renders correctly with live data renders correctly with historical data — no branching, no origin checks, no special cases.

The dependency between stores is one-directional:

```
useHistoryStore → useEnergyStore   (permitted)
useEnergyStore  → useHistoryStore  (forbidden — would create a cycle)
```

### Time modes

`TimeMode` (`'live' | 'historical'`) is defined in `packages/domain`. The mode lives in `useHistoryStore`. Components are unaware of it.

In **live** mode:
- `currentSnapshot = latestSnapshot`
- Animations run
- Timestamps are relative ("Updated 3 seconds ago")

In **historical** mode:
- `currentSnapshot = historicalSnapshot`
- Animations are paused via `--cardinal-animation-play-state: paused` on the root element
- Timestamps are absolute ("Tuesday 28 June · 14:36:22")

### Animation control in historical mode

When `useHistoryStore.isLive` is false, `App.vue` adds the class `cardinal-app--historical` to the root element. This sets the CSS custom property `--cardinal-animation-play-state: paused`, which cascades to all descendants.

Animated components use `animation-play-state: var(--cardinal-animation-play-state, running)`. They have no knowledge of live or historical mode — they simply respect the inherited value.

---

## Entity Mapping

Cardinal requires users to map their Home Assistant entities to Cardinal concepts (solar power, battery state of charge, grid import, grid export, home consumption, etc.) during setup.

Entity mapping is handled through a **Home Assistant Config Flow**:

- During setup, Cardinal inspects the HA entity registry and pre-populates mapping fields using heuristics based on device class, integration, and entity naming conventions.
- The user reviews and confirms the suggested mappings, with the ability to override any field.
- Confirmed mappings are stored in the integration's config entry and passed to the provider at initialisation.

Auto-discovery alone is not used for v1. HA installations vary too widely for heuristics to be reliable, and a silently wrong mapping violates the product principle that every calculation should be explainable.

---

## Domain Package

`packages/domain` is the single source of truth for all Cardinal domain models and types.

There is no separate `packages/types` package. If a genuine need for one emerges later, it can be extracted at that point rather than created speculatively.

---

## Architecture Principles

These principles govern every implementation decision.

**Business logic is framework-independent.**
`packages/core` contains only pure TypeScript functions. It has no dependency on Vue, Pinia, or Home Assistant. It can be tested without a browser, a DOM, or a running HA instance.

**Providers isolate external systems.**
The boundary between Home Assistant and Cardinal is the provider interface. Raw HA entity data never crosses this boundary. Only Cardinal domain models are passed upstream. Swapping a data source means writing a new provider, not touching core or UI.

**Components present only.**
Vue components read from Pinia stores and render the result. They never calculate, derive, or transform data. Business logic belongs in `packages/core`. Data access belongs in stores.

**Single source of truth.**
Application state lives in Pinia stores. The same value is never stored in two places. Components do not hold their own copies of store data.

**Explicit over implicit.**
Entity mappings are user-confirmed, not silently inferred. Calculations are surfaced, not hidden. When Cardinal cannot explain a value, it should not display it.

---

## User Experience

Cardinal is an explanation engine, not an energy dashboard.

A dashboard reports what sensors say. Cardinal explains what is happening.

Every screen answers a question a person naturally asks. Every number exists because it answers something — not because the data is available. If a value requires the user to interpret it, the interface has failed.

The primary output of Cardinal is language. Visualisations and numbers support the explanation; they do not replace it. A user should be able to understand the current state of their home by reading one sentence, then explore further if they choose.

Complexity is always optional. Simple users get simple answers. Advanced users can drill deeper. The default state is always the simplest correct answer.

---

## Toolchain

| Concern | Tool |
|---|---|
| Package manager | pnpm workspaces |
| Build | Vite |
| Build orchestration | Turborepo |
| Testing | Vitest |
| Language | TypeScript (strict mode) |
| Frontend framework | Vue |
| State management | Pinia |

No additional tooling should be introduced without a clear, demonstrated need.

---

## Resilience

Cardinal should remain useful even when data is incomplete.

- If an entity is unavailable or returns an invalid state, Cardinal treats it as `0` or `unknown` rather than throwing.
- Missing sensors produce explanatory messages ("Solar data is unavailable") rather than application errors or blank screens.
- The UI clearly communicates when information is unavailable and why, so the user knows what to fix.
- No single missing entity should prevent the rest of the application from rendering.

Resilience is not an afterthought. Every provider translation and every store getter must handle `undefined` and `NaN` inputs explicitly.

---

## v1 Scope

v1 is complete when Cardinal can answer one question:

> **What is happening in my home right now, and what has happened today?**

### In Scope

- Live energy flow (solar, battery, grid, home consumption)
- Human-readable current state summary (e.g. "Your battery is charging from excess solar.")
- Live power breakdown (solar, battery, grid, home)
- Today's energy summary (generated, consumed, imported, exported)
- Today's cost, savings, and export earnings

### Out of Scope for v1

- Historical analytics beyond today (architecture ready; timeline UI is next milestone)
- Forecasting and predictions
- Additional modules (water, gas, EV, heating, air quality)
- Time-of-use or complex tariff structures
- Multi-home or multi-dashboard support
