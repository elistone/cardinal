# Product Specification

This document describes what Cardinal does and how it should behave. It is a product description, not an implementation guide. Implementation decisions — exact durations, pixel values, breakpoint numbers — belong in the code and the design system.

---

## 1. Philosophy

Cardinal is an energy narrator, not a dashboard.

Its job is to answer two questions:

1. **What is my home doing with energy right now?**
2. **How did today go?**

Every element on screen must serve one of those two questions. If it does not, it should not be there.

The primary output is language. A user should be able to understand their home's energy state by reading a single sentence. Numbers and diagrams support that sentence; they do not replace it.

### Core Principles

**Text leads.** The insight headline is the most important element on any screen. Everything else is supporting evidence.

**Numbers earn their place.** A value appears only if it answers a question a person naturally asks. Raw sensor data is never displayed for its own sake.

**States are content.** Loading, unavailable, degraded, and error states must explain what is happening and what (if anything) the user can do. They are part of the product, not edge cases.

**Simplicity is the default.** The default view is the simplest correct answer to the two questions above. Nothing is shown by default that requires interpretation.

---

## 2. Information Architecture

Cardinal is a **single scrollable panel**. There is no navigation, no tabs, no secondary screens — only a single vertical flow with two named sections and one overlay.

```
┌─────────────────────────┐
│ Header                  │
├─────────────────────────┤
│ NOW section             │
│  · Insight block        │
│  · Energy flow diagram  │
│  · Live metric cards    │
├─────────────────────────┤
│ TODAY section           │
│  · Today's energy cards │
│  · Financial summary    │
└─────────────────────────┘
         ↕ scroll
```

The **Sensor Health overlay** is accessed from the header. It appears on top of the main panel and shows the health of all configured sensors.

### Sections

**NOW** — answers "What is my home doing right now?" Live data. Updates continuously.

**TODAY** — answers "How has today gone?" Accumulated totals for the current day. Updates less frequently.

---

## 3. Screen Layout

### Wide viewports (desktop)

On wide viewports, the layout gains horizontal space. The energy flow diagram and metric cards may appear side by side. The insight block spans the full width above them.

```
┌──────────────────────────────────────────────────────┐
│ Cardinal                              [Health] [⚙]   │
├──────────────────────────────────────────────────────┤
│ NOW                                                  │
│                                                      │
│ Your home is running entirely on solar right now.    │
│ The excess power is charging your battery.           │
│                                                      │
│ ┌─────────────────────┐  ┌────────────────────────┐ │
│ │   Energy Flow       │  │ Solar    3.4 kW        │ │
│ │   [diagram]         │  │ Battery  +1.3 kW       │ │
│ │                     │  │ Grid     0 W           │ │
│ │                     │  │ Home     2.1 kW        │ │
│ └─────────────────────┘  └────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ TODAY                                                │
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ │ Generated│ │ Consumed │ │ Imported │ │Exported │ │
│ │ 18.4 kWh │ │ 12.1 kWh │ │  0.8 kWh │ │ 6.3 kWh │ │
│ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│                                                      │
│ Saved £2.40 · Earned £1.89 · Net benefit £4.29      │
└──────────────────────────────────────────────────────┘
```

### Medium viewports (tablet)

Similar to wide layout but with reduced horizontal margins. The flow diagram and metrics may stack vertically if space is insufficient to show both comfortably side by side.

### Narrow viewports (mobile)

All elements stack vertically. The flow diagram scales to fill the available width. Metric cards stack in a two-column or single-column grid depending on available space.

```
┌─────────────────────┐
│ Cardinal    [⚙][❤]  │
├─────────────────────┤
│ NOW                 │
│                     │
│ Your home is running│
│ entirely on solar.  │
│ The excess is       │
│ charging your       │
│ battery.            │
│                     │
│ ┌─────────────────┐ │
│ │  Energy Flow    │ │
│ │  [diagram]      │ │
│ └─────────────────┘ │
│                     │
│ ┌───────┐ ┌───────┐ │
│ │Solar  │ │Battery│ │
│ │3.4 kW │ │+1.3kW │ │
│ └───────┘ └───────┘ │
│ ┌───────┐ ┌───────┐ │
│ │Grid   │ │Home   │ │
│ │0 W    │ │2.1 kW │ │
│ └───────┘ └───────┘ │
├─────────────────────┤
│ TODAY               │
│ ...                 │
└─────────────────────┘
```

---

## 4. Header

The header is minimal and persistent. It identifies the application and provides access to the two secondary actions.

**Contents:**
- Application name or wordmark
- Sensor health button (opens the Sensor Health overlay)
- Settings link (opens HA config flow)

The header must not scroll away. It remains fixed at the top of the viewport.

---

## 5. Insight Block

The insight block is the primary content area. It occupies the top of the NOW section and sets the context for everything below.

**Structure:**
- **Headline** — one complete sentence describing what the home is doing right now
- **Description** — one or two sentences of supporting context or elaboration

**The headline is the most visually prominent text on the screen.** It should read like a statement a knowledgeable friend would make, not like a sensor label.

Examples:

> *Your home is running entirely on solar right now.*

> *Your battery is being charged by excess solar — no grid needed.*

> *Grid is your main power source tonight. Solar generation has stopped.*

The description may include a number if it answers an obvious follow-up question:

> *The excess 1.3 kW is going into your battery.*

Numbers in the insight should be rounded and human-scale. They are not precision instruments; they are context.

---

## 6. Energy Flow Diagram

A visual representation of energy movement between the four nodes: **Solar**, **Battery**, **Grid**, and **Home**.

**Layout:** Four nodes arranged so that generation sources (Solar) and external connections (Grid) are visually distinct from storage (Battery) and consumption (Home).

**Paths:** Directional connections between nodes. A path is shown only when energy is actively flowing in that direction. The direction of the path animation matches the direction of energy flow.

**Inactive paths:** When no energy is flowing between two nodes, the path between them is suppressed or visually neutral. It must not appear active.

**Relative magnitude:** Path weight or opacity should indicate relative flow strength. A 5 kW solar feed should look more significant than a 0.3 kW grid import.

**States:**
- Normal: paths animate in flow direction
- Night / idle: all paths are neutral; diagram shows nodes without active flows
- Loading: placeholder layout with no live data
- Degraded: nodes with missing data are visually distinct from nodes with data

---

## 7. Live Metric Cards

Four cards showing live power readings, one per energy concept: Solar, Battery, Grid, Home.

**Each card shows:**
- Current power (live, updated as data arrives)
- Unit (kW or W, chosen to keep the number readable)
- Label (plain English, e.g. "Solar output", "Battery charging", "Grid import")
- Optional: color accent matching the concept's color token

**Live-updating values must use tabular numeral alignment** (`font-variant-numeric: tabular-nums`) so the layout does not shift as digits change.

**Battery card:** When the battery is charging, the value should be prefixed or labelled to indicate direction (e.g. "+1.3 kW" or "Charging 1.3 kW"). When discharging, similarly labelled. When idle, "Standby" or similar.

**States per card:** normal, unavailable (show em-dash, not zero), loading (skeleton).

---

## 8. TODAY Section

### Energy Cards

Four cards showing accumulated energy totals for the current day: Generated, Consumed, Imported, Exported.

These update less frequently than live metric cards. They represent the running daily total, not a momentary snapshot.

**Each card shows:**
- Total energy (kWh)
- Label (e.g. "Generated today", "Imported today")

### Financial Summary

A grouped block showing the day's financial outcome.

**Three rows:**
- **Saved** — cost avoided by not importing energy that was self-generated
- **Earned** — revenue from grid export
- **Net benefit** — sum of saved and earned

All three rows are shown together, or none. Showing partial financial data is misleading.

Values should be positive. Direction is communicated through the label ("Saved", "Earned"), not through sign.

---

## 9. Sensor Health Overlay

A full-panel overlay listing all configured sensor mappings and their current health.

**Triggered by:** the health button in the header.

**Structure:**
- Heading
- One row per configured sensor, showing: entity name, Cardinal concept, current state, optional resolution hint
- Dismiss button

**Health states displayed:**
- `configured` — sensor is present and returning valid data
- `missing` — sensor is not mapped in configuration
- `unavailable` — sensor is mapped but HA reports it unavailable
- `invalid` — sensor is mapped but returns an unexpected value type

**Accessibility:** The overlay must trap keyboard focus while open. It must have `role="dialog"` and `aria-modal`. Pressing Escape dismisses it.

---

## 10. All States

### Loading

Shown while the WebSocket connection is being established and the first data has not yet arrived.

- Skeleton layout matching the expected content
- No spinner unless there is a known time-bounded operation
- `aria-busy` or equivalent for screen readers

### Night / Idle

Shown during night hours or when solar is zero and no significant activity is occurring.

The insight changes to reflect the night state, e.g.:

> *Your home is quiet tonight. Battery and grid are maintaining standby load.*

The flow diagram shows only active paths (likely just grid or battery → home at low levels).

### Missing Sensor

One or more required sensor mappings are absent from configuration.

The insight explains specifically what is missing:

> *Solar data isn't available. Assign your solar inverter entity in settings to see solar production.*

Cardinal renders what it can with the remaining sensors. Missing sensors degrade, not break, the experience.

### Unavailable Sensor

A mapped sensor is returning `unavailable` or `unknown` from HA.

The insight acknowledges the gap:

> *Battery data is temporarily unavailable. Your inverter may be restarting.*

The affected cards show a dash, not zero.

### Disconnected

The WebSocket connection to HA has been lost.

- A clear banner or state change indicates the connection is lost
- Stale data is not shown as current
- The application should attempt to reconnect automatically
- The UI distinguishes between "connecting" and "reconnecting" states

### No Configuration

The user has not yet completed initial setup (entity mapping via config flow).

- A clear onboarding prompt explains what is needed
- A direct link or button to open the config flow
- This state is not an error — it is the expected initial experience

---

## 11. First-Time Experience

A user arriving for the first time has not yet mapped their entities. Cardinal should:

1. Detect that no configuration exists
2. Show a welcoming, non-alarming explanation of what it needs
3. Provide a single clear action to begin setup

After setup is complete, Cardinal should load with live data immediately. There should be no "empty state" after successful configuration — the NOW section should be populated.

---

## 12. Motion and Animation

See `docs/performance.md` for animation guidelines and `prefers-reduced-motion` requirements.

### Philosophy

Cardinal's live display should feel like a calm, living instrument — **breathing, not blinking**. Updates happen smoothly and without drawing unnecessary attention.

The flow diagram's path animation is the most prominent use of motion. It should be gentle and continuous, not distracting. A slower, calmer pace is almost always better than a faster one.

### State Transitions

When the application moves from one state to another (e.g. loading → live data, one insight to another), the transition should be smooth enough to not feel abrupt, but fast enough not to feel slow. Do not prioritise transition elegance over the user getting to useful content.

### Live Value Updates

Numeric values that update in real time must not cause layout shift. The number changes; the space it occupies does not.

Do not animate individual digit changes. The number updates; no number-by-number animation is needed.

---

## 13. Color

See `docs/design-system.md` for the full color token list.

Each energy concept has a dedicated color applied consistently across the flow diagram, metric cards, and chart accents. Colors are defined as CSS custom properties and must support both light and dark modes via `prefers-color-scheme`.

Functional colors (success, warning, error) are separate from the energy concept colors and must not be mixed.

---

## 14. Typography

Typography serves legibility and hierarchy. The scale has three levels:

- **Display** — the insight headline. Largest text on screen. Communicates the primary message.
- **Body** — the insight description, card labels, and supporting text. Comfortable reading size.
- **Supporting** — units, timestamps, secondary labels. Smaller, subdued.

Numeric values in metric cards use tabular numeral alignment to prevent layout shift during live updates.

The typography scale should be responsive: slightly larger on wide viewports where reading distance is greater.

---

## 15. Accessibility

Cardinal must be usable without a mouse and must work with screen readers.

### Semantic Structure

Use the correct HTML elements for their purpose:
- `<main>` for the primary panel content
- `<section>` with visible or screen-reader labels for NOW and TODAY
- `<article>` or `<li>` for individual cards
- `<button>` for all interactive controls
- `role="dialog"` and `aria-modal` for the sensor health overlay

### Live Regions

Live-updating values must be wrapped in `aria-live="polite"` regions so screen readers announce changes without interrupting the user.

The insight headline should also be in an `aria-live` region so users are informed when the narrative changes.

### Focus Management

When the Sensor Health overlay opens, focus must move to the overlay. When it closes, focus must return to the element that opened it.

All interactive elements must have visible focus indicators.

### Reduced Motion

When `prefers-reduced-motion: reduce` is set:
- Energy flow animation: replace with opacity difference between active and inactive states
- State transitions: opacity change only, no movement
- Skeleton loaders: static

### Color

All text meets WCAG AA contrast against its background. Information conveyed through color must also be conveyed through another means (label, icon, shape).

---

## 16. Key Product Decisions

| Decision | Choice | Reason |
|---|---|---|
| Application model | Single scrollable panel | Removes navigation overhead; one question per section |
| Primary content | Insight text | Numbers require interpretation; language does not |
| Section names | NOW / TODAY | Communicate time scope without jargon |
| Financial display | All-or-nothing | Partial financial data is misleading |
| Flow diagram | Directional animated paths | Shows movement, not just state |
| Sensor gaps | Degrade gracefully, explain clearly | A broken number is worse than no number |
| Live updates | No animation on digit change | Calm is better than reactive |
| History | Out of scope for v1 | Focus: explain now, not then |
| Configuration | HA Config Flow | Standard HA pattern; user-confirmed mapping only |
| Auto-discovery | Heuristics suggest, user confirms | Silent wrong mapping violates explainability principle |
