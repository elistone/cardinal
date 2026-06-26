# Performance

Cardinal runs inside Home Assistant as a custom panel. Its performance characteristics must meet the expectations of a first-party application — it should never feel like an embedded web page.

---

## Principles

**Perceived performance matters more than measured performance.** A 500ms load that feels instant (because a skeleton appeared immediately) is better than a 200ms load that feels slow (because the screen was blank).

**Data should never block the UI.** The application should render immediately on load, even in a loading state. No blocking network calls before first render.

**Live updates must feel calm.** Cardinal displays live sensor data that may update every second or more. Updates must feel like natural changes in a steady display — not flickering, jumping, or causing layout shifts.

---

## Rendering

### First Render

- The panel must render a visible, meaningful UI on the first frame after mount
- If data is not yet available, the loading state (skeletons) should appear immediately
- There must be no blank screen between mount and first meaningful paint

### Live Updates

- Pinia store updates triggered by WebSocket events must propagate to the UI without causing full component re-renders where Vue's reactivity system can avoid them
- Numeric values that update frequently must use `font-variant-numeric: tabular-nums` to prevent text reflow on each update
- Layout should not shift when a value changes — component dimensions should be stable across data updates

### Scroll

- The single-panel scroll view must be smooth at the device's native refresh rate
- No scroll-triggered JavaScript should block the main thread

---

## Animations

All animations serve communication, not decoration. They must earn their place.

### Motion Hierarchy

**Instant:** State changes that would otherwise feel broken if delayed (e.g. toggling a toggle, dismissing a dialog). No animation needed.

**Fast:** Feedback for user actions (e.g. button press, badge tap). Short and snappy.

**Moderate:** Transitions between UI states (e.g. loading → data loaded, section appearing). Smooth but quick.

**Slow:** Sustained ambient motion (e.g. energy flow path animation). Gentle, continuous, calm.

Use these descriptions — not specific millisecond values — when designing component behaviour. Implementation should choose durations that feel right for the category.

### Reduced Motion

Every animation in Cardinal must have a `prefers-reduced-motion: reduce` alternative. When reduced motion is set:

- Energy flow path animation: replace motion with opacity difference (active vs. inactive)
- State transition animations: reduce to opacity change only (no movement or scale)
- Loading skeletons: static instead of pulsing

No information must be conveyed through motion alone. Motion is always supplementary.

### Easing

Prefer ease curves that feel physical and purposeful. Avoid linear motion for UI transitions. Avoid extreme bounce or spring effects.

---

## WebSocket

Cardinal's live data comes from the Home Assistant WebSocket API. The WebSocket connection is managed by the provider layer (`packages/providers`).

### Subscription Management

- Cardinal should subscribe only to entities it has mapped — not all HA entity state changes
- Subscriptions should be established once on initialisation, not recreated on each component mount or re-render
- Subscriptions must be cleaned up on panel unmount to prevent memory leaks

### Update Frequency

- The provider receives HA state-change events as they arrive — Cardinal does not poll
- If the same entity fires multiple rapid updates (e.g. during a HA restart), the provider may debounce updates before pushing to the store. This prevents unnecessary re-renders during unstable states.
- Debounce duration should be short enough that the UI remains responsive, but long enough to absorb burst events

### Connection States

The application must handle all WebSocket lifecycle states explicitly:

| State | User-facing behaviour |
|---|---|
| Connecting | Show loading state |
| Connected | Show live data |
| Reconnecting | Show reconnecting indicator; do not show stale data as live |
| Disconnected | Show disconnected state with last-known-good timestamp if available |

Stale data must never be presented as current. If the connection is lost, the UI must make this clear.

### Error Handling

- A failed WebSocket message must not crash the application
- Individual entity translation errors must be caught at the provider layer and surfaced as health state changes, not thrown exceptions
- The application must remain usable for all correctly-functioning entities even when one entity fails

---

## Goals (v1)

These are directional targets, not hard SLAs. Measure against them if performance concerns arise.

| Metric | Target |
|---|---|
| First meaningful paint | Under 1 second on a modern HA instance |
| Time to live data | Under 3 seconds from panel open |
| Live update latency | Within 1 second of HA entity state change |
| Memory growth over time | Stable — no unbounded accumulation of event listeners or store state |

---

## What to Avoid

- Polling HA for state; only WebSocket subscriptions
- Subscribing to all entity state changes instead of mapped entities
- Re-creating subscriptions on component re-renders
- Storing duplicate state (e.g. storing the same value in both a store and a component's local ref)
- Animations that trigger layout recalculation on every frame (avoid animating `width`, `height`, `top`, `left` — prefer `transform` and `opacity`)
