# Cardinal

> Understand your home. Not your sensors.

Cardinal is an energy explanation engine for Home Assistant.

Rather than displaying raw sensor values and charts, Cardinal tells you what is happening in plain English — what your home is doing with energy right now, and how today has gone.

> Your home is running entirely on solar right now. The excess power is charging your battery.

---

## Status

**v0.1.0 — First live release.**  
Cardinal runs inside Home Assistant with real sensor data. See [docs/releases/v0.1.0.md](docs/releases/v0.1.0.md) for what is included.

---

## What Cardinal does

- **Explains the current energy state** in a single sentence, updated in real time
- **Shows today's totals** — energy generated, consumed, exported, and the financial result
- **Monitors sensor health** — flags missing, unavailable, or misconfigured entities immediately
- **Includes a diagnostics panel** — energy balance check, raw entity values, and translated snapshot for debugging configuration issues

---

## Installation

v0.1.0 requires manual installation. HACS support is planned for v0.2.0.

See [docs/manual-installation.md](docs/manual-installation.md) for full instructions.

In brief:

1. Download `cardinal-0.1.0.zip` from [Releases](https://github.com/eli-stone/cardinal/releases)
2. Extract into your Home Assistant `custom_components/` directory
3. Restart Home Assistant
4. **Settings → Devices & Services → Add Integration → Cardinal**
5. Map your energy entities and Cardinal appears in the sidebar

---

## Screenshots

| Solar charging | Running on battery |
|---|---|
| ![Solar charging](docs/screenshots/0001-now-live.png) | ![Battery discharging](docs/screenshots/0006-running-on-battery.png) |

| Sensor health overlay | Disconnected state |
|---|---|
| ![Health overlay](docs/screenshots/0008-health-overlay.png) | ![Disconnected](docs/screenshots/0004-disconnected.png) |

---

## Philosophy

Every screen should answer a question. Every number should have meaning. Complexity should always be optional.

Cardinal is an **energy explanation engine** — not a dashboard. The goal is not to display more numbers. The goal is to explain what is happening in the user's home, why it is happening, and what it means.

See [docs/product-manifesto.md](docs/product-manifesto.md) and [CLAUDE.md](CLAUDE.md) for the full philosophy.

---

## Architecture

Cardinal is a TypeScript monorepo with a thin Python integration layer.

```
packages/domain      — pure TypeScript models, zero dependencies
packages/core        — business logic (calculations, insight generation)
packages/providers   — Home Assistant adapter (WebSocket, entity translation)
packages/ui          — Vue 3 component library
apps/frontend        — Pinia store, Web Component shell
apps/integration     — Python custom component (config flow, panel registration)
```

See [docs/architecture.md](docs/architecture.md) for the full architectural overview.

---

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.12+ (for integration work)

### Setup

```sh
pnpm install
```

### Run in browser (with mock data)

```sh
pnpm --filter @cardinal/frontend dev
```

Opens a browser with a `MockEnergyProvider` cycling through four realistic energy scenarios every 5 seconds. No Home Assistant required.

### Run Storybook

```sh
pnpm --filter @cardinal/ui storybook
```

### Tests

```sh
pnpm --filter '@cardinal/*' run test
```

### Type check

```sh
pnpm type-check
```

### Build

```sh
pnpm build
```

### Deploy to Home Assistant (development)

See [docs/developer-setup.md](docs/developer-setup.md).

---

## Documentation

| Document | Contents |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Project philosophy, architecture principles, coding standards |
| [docs/architecture.md](docs/architecture.md) | Package structure, data flow, deployment model |
| [docs/product-specification.md](docs/product-specification.md) | What Cardinal does and how it should behave |
| [docs/manual-installation.md](docs/manual-installation.md) | Installation instructions |
| [docs/developer-setup.md](docs/developer-setup.md) | Local development workflow |
| [docs/testing.md](docs/testing.md) | Testing philosophy and test structure |
| [docs/releases/v0.1.0.md](docs/releases/v0.1.0.md) | v0.1.0 release notes |
| [CHANGELOG.md](CHANGELOG.md) | Full changelog |

---

## Releases

| Version | Date | Notes |
|---|---|---|
| [v0.1.0](docs/releases/v0.1.0.md) | 2026-06-27 | First live Home Assistant release |

---

## Licence

MIT
