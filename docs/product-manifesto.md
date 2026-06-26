# Product Manifesto

## What Cardinal Is Not

Home Assistant already has an energy dashboard. It shows graphs, totals, and historical charts. It reports what your sensors say.

Cardinal does not do that.

Cardinal is not a dashboard. It is not a graph viewer. It is not a data export tool.

## What Cardinal Is

Cardinal is an explanation engine.

It reads your home's data and turns it into sentences a person can understand without effort or prior knowledge.

The primary output of Cardinal is language. Numbers and visualisations exist to support the explanation — they do not replace it.

## The Single Test

A user should understand the current state of their home within five seconds of opening Cardinal.

If they need to interpret a graph, read a tooltip, or mentally cross-reference two numbers to understand what is happening, Cardinal has failed.

## How Cardinal Is Different

### Energy Dashboards Report. Cardinal Explains.

A typical HA energy dashboard shows:

- Solar: 3.4 kW
- Battery: 72%
- Grid: 0W
- Home: 2.1 kW

These are true. They are not useful to most people.

Cardinal says:

> **Your home is running entirely on solar right now.** The excess 1.3 kW is charging your battery — no grid needed.

One sentence. No interpretation required.

### Numbers Are Evidence, Not Content

Cardinal never displays a number simply because the data exists. Every value on screen earns its place by answering a question a person naturally asks:

- *How much am I generating?* → Solar: 3.4 kW
- *What did I save today?* → £2.40 avoided import costs

If removing a number would not cause confusion, it should be removed.

### The Insight Leads. Everything Follows.

Every screen state in Cardinal begins with a human-readable headline and a one or two sentence description. Metrics, flow diagrams, and charts sit below the insight — not above it.

This is the opposite of how most dashboards work. Most dashboards front-load numbers and expect users to synthesise an understanding. Cardinal synthesises first and provides numbers as supporting evidence.

### Sensor Problems Are First-Class

When data is unavailable, Cardinal tells you what is missing and why — not just that something is broken. A missing solar sensor produces a message like "Solar data isn't available — check that your inverter entity is assigned in settings." The application remains usable for what it can still explain.

### Simplicity Is the Default

Cardinal never exposes complexity unless the user asks for it. The default view answers two questions:

1. What is my home doing with energy right now?
2. How did today go?

Advanced users can explore further. Simple users get a complete, useful answer without drilling into anything.

### Mobile Is the Primary Context

People check their energy status from their phone. Cardinal is designed for a phone first. The desktop layout is an enhancement, not the baseline.

## What This Means for Every Decision

Before adding anything to Cardinal, ask:

1. Does this explain something, or does it just display data?
2. Does it answer a question a person naturally asks?
3. Can a first-time user understand it in five seconds?
4. Does it make sense on a phone screen?

If the answer to any of these is no, reconsider.
