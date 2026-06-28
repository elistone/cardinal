# Time Travel

> Cardinal should not only explain what your home is doing.
>
> It should allow you to revisit what your home was doing at any moment in time.

Time Travel is a core product capability, not simply a timeline control.

It allows the entire application to render itself exactly as it would have appeared at a previous moment.

---

# Philosophy

Cardinal always has two modes:

* Live
* Historical

The user should always know which mode they are viewing.

Everything else in the application should behave identically.

The same components render both live and historical data.

---

# Product Principles

## Live is the default

Opening Cardinal always shows the current state of the home.

The application should immediately begin receiving live updates.

---

## History is intentional

Users enter history deliberately.

Once viewing history, the interface remains stable until the user changes the selected time.

Historical mode never "catches up" automatically.

---

## Live always feels alive

When viewing live data:

* Energy flows animate.
* Values update.
* Live indicator pulses.
* "Last updated" advances naturally.

The application feels connected to a living home.

---

## History is frozen

Historical snapshots should feel paused.

Animations stop.

Energy flow becomes static.

Numbers remain fixed.

The interface becomes a snapshot rather than a live instrument.

---

## Time never changes the interface

Changing time should never change navigation or layout.

Only the data changes.

Users should feel as though they are looking through a window into another moment.

---

# Interaction

## Timeline

A timeline is displayed whenever historical data is available.

It should feel closer to professional media editing software than a generic slider.

Users can:

* Drag
* Click
* Use arrow keys
* Jump to live
* Jump to beginning/end
* Zoom into shorter time ranges

The timeline should always feel responsive.

---

## Live Button

The far-right position represents LIVE.

Returning to LIVE immediately resumes:

* animations
* live updates
* relative timestamps

Example:

● LIVE
Updated 3 seconds ago

---

## Historical Indicator

While viewing history:

🕒 Tuesday 28 June
14:36:22

Relative timestamps are replaced with absolute dates and times.

There should never be ambiguity about whether the interface is live.

---

# Time Range

Time Travel should eventually support multiple ranges.

Examples:

* Last hour
* Today
* Yesterday
* This week
* Custom date

The interaction model should remain identical regardless of range.

---

# Snapshot Architecture

Every UI component should render from a single source:

currentSnapshot

When live:

currentSnapshot = latestSnapshot

When travelling through time:

currentSnapshot = historicalSnapshot

Components should never care where the snapshot originated.

This keeps the application architecture simple and predictable.

---

# Motion

Motion follows time.

## Live

Animations enabled.

## Historical

Animations paused.

No pulsing.

No flowing particles.

No counting numbers.

Historical data should feel calm and inspectable.

---

# Scrubbing

Dragging the timeline should update the interface continuously.

The user should immediately see:

* Insight
* Energy flow
* Metric cards
* TODAY summary
* Diagnostics

change together.

The application should feel like one coherent object moving through time.

---

# Replay

Future enhancement.

Users should be able to replay an entire day.

The timeline automatically advances through historical snapshots.

Energy flows animate.

Insights evolve.

The home's day becomes a visual story.

Replay should feel educational rather than decorative.

---

# Timeline Visualisation

The timeline should communicate more than time.

Rather than a plain slider, it should visualise activity.

Examples include:

* Solar generation
* Overall power movement
* Household demand

Users should instinctively see where interesting events occurred before scrubbing.

Example:

▁▁▂▃▄▆█▇▅▄▂▁

The waveform should remain subtle.

It is navigation, not a chart.

---

# Event Markers

Future enhancement.

Interesting moments may appear along the timeline.

Examples:

* Sunrise
* Sunset
* Battery full
* Grid import begins
* Solar export begins
* Peak generation
* Highest home demand

Selecting an event jumps directly to that moment.

---

# Narrative

Time Travel should reinforce Cardinal's identity as an explanation engine.

As the user scrubs:

* Insights evolve.
* Explanations change.
* Context updates.

The user should understand not only that the home changed, but why it changed.

---

# Accessibility

The timeline must be fully keyboard accessible.

Screen readers should announce:

* Current timestamp
* Live or historical mode
* Selected event markers

Motion must respect prefers-reduced-motion.

Replay must always be pausable.

---

# Future Opportunities

Time Travel unlocks features that would otherwise be impossible.

Examples include:

* Compare two moments.
* Replay an entire day.
* Investigate unusual energy events.
* Jump to peak solar generation.
* Jump to battery full.
* Jump to highest import.
* Explain why energy behaviour changed.
* Compare today with yesterday.

These should all build upon the same underlying Time Travel architecture.

---

# Guiding Question

Every implementation should answer:

> "If I stopped my home at this exact moment in time, would Cardinal show me exactly what I would have seen then?"

If the answer is yes, Time Travel has been implemented correctly.
