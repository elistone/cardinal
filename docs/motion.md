# Motion Design

> Motion is not decoration.
>
> Motion exists to communicate the living state of a home's energy system.

Cardinal is an explanation engine, not a dashboard. Every animation should help the user understand their home's energy at a glance.

---

# Core Principles

## Calm

Motion should feel slow, confident and reassuring.

Avoid sharp acceleration, bouncing, or playful effects.

The feeling should be closer to breathing than pulsing.

---

## Purpose

Every animation must communicate something.

If removing an animation makes the interface easier to understand, the animation should not exist.

---

## Continuous Life

A connected home is never completely static.

Cardinal should always contain small, subtle signs of life:

* Live connection indicator
* Relative "Last updated" timestamp
* Energy flow animation
* Breathing active nodes

These should never distract from the content.

---

## Energy Has Weight

Energy is physical.

Motion should make energy feel tangible.

Large amounts of power should appear stronger than small amounts of power.

---

## Energy Has Momentum

Power is not binary.

A home exporting 100W should not feel the same as exporting 5kW.

Animations should scale continuously with energy magnitude.

---

## Accessibility

Every animation must respect `prefers-reduced-motion`.

Reduced motion removes movement but preserves information hierarchy.

---

# Motion Language

Motion follows energy.

Energy is represented through four visual properties:

* Speed
* Brightness
* Thickness
* Presence

These properties should work together rather than independently.

---

# Animation Rules

## Speed

Animation speed represents power.

More power → faster movement.

Examples:

* Energy flow particles
* Node breathing
* Connection pulses

Speed should scale smoothly rather than jumping between predefined levels.

Use logarithmic scaling where appropriate so both 100W and 5kW remain visually distinguishable.

---

## Brightness

Brightness represents energy intensity.

Higher power should subtly increase perceived brightness.

Examples:

* Active nodes
* Flow paths
* Metric card accent bars
* Icon glow

Brightness should never become visually noisy.

It should communicate "importance", not "flashiness".

---

## Thickness

Thickness represents volume.

Examples:

* Energy flow paths
* Accent borders
* Connection strokes

Higher wattage should produce slightly thicker visual elements.

The change should remain subtle.

---

## Presence

Inactive systems should never disappear.

Instead they become dormant.

Examples:

* Ghosted flow paths
* Dimmed nodes
* Reduced opacity

The entire home's energy topology should remain visible even when inactive.

---

# Visual Hierarchy

Information should reveal itself in this order:

1. Insight
2. Energy Flow
3. Metric Cards
4. Supporting information

Motion should reinforce this hierarchy.

---

# Metric Cards

Metric cards should communicate change without requiring the user to read numbers.

## Accent Bar

The coloured top accent should represent magnitude.

Larger values:

* brighter
* slightly thicker
* subtly animated when changing

Zero values become quieter rather than disappearing.

## Value Changes

Numeric changes should:

* animate smoothly
* briefly brighten
* settle quickly

Users should notice that something changed without needing to compare digits.

---

# Energy Flow Diagram

The Energy Flow Diagram is Cardinal's signature visual.

It should immediately answer:

> Where is energy coming from?

and

> Where is it going?

Flow animation should communicate:

* direction
* speed
* intensity

without requiring the user to read labels.

---

# Connection

Loading is not waiting.

Loading is understanding.

The loading state should communicate progress through the home's energy system.

Users should feel Cardinal is preparing an explanation rather than waiting for data.

---

# Showroom Mode

Every animation should also work in deterministic Showroom Mode.

This ensures:

* Storybook remains representative.
* Screenshots remain consistent.
* Marketing material reflects the real application.
* Motion can be reviewed independently of live data.

---

# Design Philosophy

Cardinal should never feel like industrial monitoring software.

It should feel like quietly observing a living system.

Calm.

Reliable.

Thoughtful.

Always alive.

Never distracting.

---

# Guiding Question

Before introducing any animation, ask:

> Does this help someone understand their home's energy better than they did one second ago?

If the answer is no, the animation does not belong.
