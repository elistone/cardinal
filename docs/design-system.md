# Design System

This document describes Cardinal's reusable UI components. It defines what each component is for and how it behaves, not how it is implemented. Implementation lives in `packages/ui`.

---

## Principles

**Text first.** Every component that can carry language should. Numbers support explanation; they do not replace it.

**Consistent structure.** The same problem should always look the same. A metric is always a metric. An insight is always an insight.

**States are content.** Loading, empty, error, and unavailable states are part of the component's design, not afterthoughts.

**Reduced motion.** Every animated component must respect `prefers-reduced-motion`. Animations are decorative, not functional.

---

## Color Tokens

Cardinal's energy concepts each have a dedicated color. These tokens are used consistently across all components.

| Token | Concept |
|---|---|
| `--color-solar` | Solar generation |
| `--color-battery-charging` | Battery charging |
| `--color-battery-discharging` | Battery discharging |
| `--color-battery-idle` | Battery idle / standby |
| `--color-grid-import` | Grid import |
| `--color-grid-export` | Grid export |
| `--color-home` | Home consumption |
| `--color-savings` | Cost savings |
| `--color-earnings` | Export earnings |

Never hardcode color values. Always use the token.

---

## Typography

| Role | Characteristics |
|---|---|
| Insight title | Large, bold, high visual weight — the most prominent text on screen |
| Insight description | Readable body size, normal weight |
| Metric value | Numerically tabular (`font-variant-numeric: tabular-nums`), prominent |
| Metric label | Small, subdued, below the value |
| Section heading | Uppercase or small-caps, moderate weight |
| Supporting text | Small, subdued — used for caveats, units, timestamps |

---

## Components

### Insight Block

The primary communication unit. Used at the top of every active screen state.

**Structure:**
- Headline: one short sentence explaining what is happening
- Description: one or two sentences of supporting context

**Rules:**
- The headline must be a complete sentence
- Numbers in the headline are kept to a minimum — they appear in metrics below
- The description may reference a specific number if it answers a natural follow-up question

**States:** active (normal), degraded (some data missing but partial insight available), unavailable (no insight possible)

---

### Metric Card

A single named value, typically a power reading or energy total.

**Structure:**
- Value (prominent, tabular numerals)
- Unit (small, adjacent to value)
- Label (below value, subdued)
- Optional: energy concept color accent or icon

**Rules:**
- One value per card
- Labels must be human-readable (e.g. "Solar output", not "pv_power")
- Live-updating values must use `aria-live` for screen reader accessibility
- Cards group naturally by concept (power cards together, energy cards together)

**States:** normal, loading (skeleton), unavailable (shows em-dash, not zero)

---

### Today Card

A daily energy total. Structurally similar to a metric card but semantically distinct — these represent accumulated totals for the day, not live readings.

**Structure:**
- Value (energy total)
- Unit
- Label (what was generated, consumed, imported, or exported)

**Distinction from Metric Card:** Today cards represent completed or in-progress day totals. They do not update in real time with the same frequency as live power readings.

---

### Financial Summary

A grouped component showing the day's financial outcome.

**Structure:**
- Avoided import cost
- Export earnings
- Net benefit (sum)

Each row: label, value, optional brief explanation.

**Rules:**
- Show all three lines or none — a partial financial summary is misleading
- Values are always positive; sign is communicated through label language ("Saved", "Earned", "Net benefit")

---

### Energy Flow Diagram

A visual representation of energy movement between four nodes: Solar, Battery, Grid, Home.

**Nodes:**
- Solar (top or left, generation source)
- Battery (storage node)
- Grid (import/export node)
- Home (consumption sink)

**Paths:** Directional connections between nodes. Active paths are animated to show flow direction. Inactive paths are suppressed or muted.

**Rules:**
- Animation direction must match actual energy direction
- Path thickness or opacity should reflect relative flow magnitude
- Zero-flow paths must not appear active
- Must respect `prefers-reduced-motion`: when set, use opacity change instead of motion

**States:** active (flows shown), idle (night/no generation), loading (skeleton or dim), degraded (some nodes missing data)

---

### Sensor Health Badge

An inline status indicator for an individual sensor.

**States:**
- `configured` — sensor is present and returning valid data (success / neutral)
- `missing` — sensor is not mapped in configuration (warning)
- `unavailable` — sensor is mapped but HA reports it unavailable (warning or error)
- `invalid` — sensor returns an unexpected value type (error)

**Rules:**
- Badges should include a short descriptive label, not just a color or icon
- Tapping a badge should open the Sensor Health Overlay for more detail

---

### Sensor Health Overlay

A full-panel overlay listing all configured sensors and their current health state.

**Structure:**
- Heading
- List of sensor rows, each showing: entity name, Cardinal concept, current state, optional action link
- Dismiss button

**Rules:**
- Must be keyboard-accessible (focus trap while open, Escape to dismiss)
- Must use `role="dialog"` and `aria-modal`

---

### Section

A layout container grouping related components under a label.

**Structure:**
- Section heading
- Content slot

**Named sections in v1:**
- `NOW` — live energy state
- `TODAY` — daily summary

**Rules:**
- Section headings communicate time scope, not content type
- Sections stack vertically in a single scrollable panel

---

### Loading State (Skeleton)

A placeholder shown while data is being fetched or a connection is being established.

**Rules:**
- Skeleton shapes match the layout of the content they represent
- No spinner unless a task has a meaningful progress indicator
- Loading state must have an `aria-label` or `aria-busy` attribute for screen readers

---

### Empty / No Configuration State

Shown when the user has not yet completed initial setup.

**Content:** A short explanation of what Cardinal needs to get started, with a direct link to the configuration flow.

**Rules:**
- Must not show broken or missing data as an error — incomplete setup is not an error
- The call to action must be actionable (a link or button, not just an explanation)

---

### Disconnected State

Shown when the WebSocket connection to Home Assistant has been lost.

**Content:** A brief message indicating the connection was lost, with automatic retry behaviour.

**Rules:**
- Must distinguish between "connecting" and "reconnecting" states
- Must not show stale data as if it were live

---

## Accessibility Requirements

All components must:

- Use semantic HTML elements appropriate to their role
- Provide `aria-label` or visible labels for all interactive elements
- Support keyboard navigation
- Use `aria-live="polite"` on live-updating values
- Pass WCAG AA contrast for all text and meaningful icons
- Function with `prefers-reduced-motion: reduce` — no motion-dependent meaning

---

## Component Checklist

When adding a new component to `packages/ui`, verify:

- [ ] Does it have a loading state?
- [ ] Does it have an unavailable/error state?
- [ ] Does it work at all three viewport sizes?
- [ ] Does it respect `prefers-reduced-motion`?
- [ ] Does it respect `prefers-color-scheme`?
- [ ] Are live-updating values wrapped in `aria-live`?
- [ ] Are interactive elements keyboard-accessible?
