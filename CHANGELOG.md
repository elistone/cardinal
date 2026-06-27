# Changelog

All notable changes to Cardinal are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Cardinal uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] – 2026-06-27

First live release. Cardinal successfully runs inside Home Assistant using real sensor data.

### Added

**Core energy intelligence**
- Live energy snapshot covering solar generation, battery charge/discharge, grid import/export, and home consumption
- Plain-English insight generation explaining the current energy state in a single sentence
- Today's daily summary: accumulated energy totals and financial calculations (cost saved, earnings from export)
- Energy balance checker in the diagnostics panel — warns when sources and sinks diverge by more than 10%, with identification of the most likely misconfigured sensor

**Home Assistant integration**
- Config Flow for guided entity mapping with entity pickers and device-class filtering
- WebSocket subscription to live Home Assistant state — no polling
- Sensor health assessment on every state update — detects missing, unavailable, and invalid entities
- Shadow DOM CSS injection via `connectedCallback()` — required because HA's Lit element creates a shadow root that `document.head` styles cannot cross
- Web Component (`<cardinal-panel>`) registered as a custom panel in Home Assistant's sidebar

**UI components**
- `NowPanel` — layout shell with CSS container queries at 600 px for responsive two-column layout on wider viewports
- `InsightBlock` — headline insight with supporting description
- `MetricCard` — live power metric (solar, battery, grid, home) with directional labels
- `EnergyFlowDiagram` — animated SVG flow diagram showing active energy paths
- `TodayCard` — daily energy total card (kWh accumulated)
- `FinancialSummary` — today's cost saved and export earnings
- `SensorHealthBadge` — per-sensor status badge with live value and unit
- `SensorHealthOverlay` — full-screen overlay listing all sensor statuses
- `DiagnosticsPanel` — developer panel (hidden by default, toggled from header) showing raw entity values, translated snapshot, and energy balance

**States**
- Loading skeleton (null snapshot/insight renders gracefully)
- Disconnected state — stale data shown dimmed with a reconnecting banner
- No-configuration state — guides user to complete entity setup

**Developer tooling**
- `pnpm dev` — runs Cardinal in a browser with a `MockEnergyProvider` cycling through four realistic scenarios (solar charging, solar exporting, battery discharging, grid overnight)
- `pnpm verify:bundle` — post-build check that confirms all CSS selectors and the shadow DOM style ID are present in the compiled bundle
- Storybook stories for all components covering loading, normal, empty, error, and unavailable states

**Testing**
- 240 tests across 15 test files
- Integration test suite using real Home Assistant fixture payloads
- Unit tests for all business logic (calculations, insight generation, translation, health assessment)

### Architecture

- `packages/domain` — platform-independent TypeScript models; no dependencies
- `packages/core` — pure business logic; no Vue, no Home Assistant
- `packages/providers` — Home Assistant adapter; translates WebSocket state into domain models
- `packages/ui` — Vue 3 component library
- `apps/frontend` — application composition (Pinia, routing, Web Component shell)
- `apps/integration` — thin Python bridge (config flow, panel registration, asset serving)

### Known limitations

- Manual installation only — HACS support is planned for v0.2.0
- No historical charts or trend views
- No battery charge forecast or predictive insights
- Device name and integration name not yet shown alongside sensor health entries
- Config flow does not validate entity suitability at setup time — a wrongly mapped entity shows as `unavailable` after setup rather than failing at configuration

---

[Unreleased]: https://github.com/eli-stone/cardinal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/eli-stone/cardinal/releases/tag/v0.1.0
