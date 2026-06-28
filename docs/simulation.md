# Simulation

> The simulation engine does not produce fake data.
>
> It produces real data about a home that does not exist.

This distinction matters.

Cardinal's simulation engine models the physics of a domestic energy system and produces snapshots that are structurally, numerically, and causally identical to what a real home would report. Every value can be traced to a physical decision. Every energy balance is enforced.

The engine is not a test fixture. It is not a stub. It is a deterministic physical model that happens to run without hardware.

---

## Why Simulation Exists

Cardinal is an explanation engine. To explain energy behaviour clearly, it must be able to exercise and verify that explanation in every possible state — not just the states available on a particular developer's rooftop on a particular afternoon.

The simulation engine solves this.

It makes every scenario instantly reproducible, independent of hardware, weather, season, time of day, and geography. A developer in January with no solar generation can work on the peak-solar export experience with full fidelity. A designer can freeze a specific energy state at 12:00:00 on a perfect summer day and examine every pixel. A test suite can catch a regression in battery discharge logic without waiting for a battery to actually discharge.

The simulation is also a communication tool. The scenarios it produces are the canonical descriptions of what Cardinal can explain. They define the vocabulary of energy states that Cardinal must handle. Building a new scenario is equivalent to saying: this is a home state that must be understood and described.

---

## Physical Correctness Over Visual Correctness

The simulation's first obligation is to be physically correct.

This means:

- Energy must balance at every tick. `solar + grid import + battery discharge = home + grid export + battery charge`. No exceptions.
- Battery charge must be constrained to its physical range.
- A battery cannot charge and discharge simultaneously.
- The grid cannot import and export simultaneously.
- All generated snapshots must pass `validateSnapshot()` — the same invariant checker that validates live data.

Visual correctness — whether the output looks plausible to a human — is a downstream consequence of physical correctness, not a separate goal. If the physics is right and the profiles are realistic, the display will look right.

This ordering matters because it determines what we test. We test physics, not aesthetics. An energy balance check is a deterministic pass/fail. A "does this look right?" check is a human judgement that belongs in Storybook, not in the test suite.

---

## Determinism

The same inputs must always produce the same outputs.

`buildDay(scenario, date)` is a pure function. Given an identical `SimulationScenario` and an identical `Date`, it will always produce the identical sequence of `SimulatedPoint` values. No hidden randomness. No environment dependence. No time-based variance.

Determinism enables:

- **Reproducible screenshots.** A screenshot of the midday export state on the `SUNNY_SUMMER_DAY` scenario will look identical tomorrow, next week, and after a refactor.
- **Regression testing.** If a business logic change alters the insight produced for a known snapshot, a test fails deterministically.
- **Bug reproduction.** "The bug appears at minute 782 of the `EV_CHARGING_OVERNIGHT` scenario" is an exact, shareable description.
- **Parallel test execution.** No shared state, no race conditions.

### Stochastic scenarios

Some future scenarios may include realistic variation — cloud cover that fluctuates, load patterns that are not perfectly smooth, tariffs that vary at the minute level.

When stochastic elements are needed, they must be introduced through a seeded random number generator. The seed is part of the scenario's identity. The same scenario with the same seed always produces the same output. The seed can be omitted for development convenience but must be provided for any scenario used in tests, screenshots, or documentation.

This is a future requirement. The current engine is fully deterministic without explicit seeding because no stochastic elements exist yet.

---

## Validation

Every snapshot the simulation produces is validated by `validateSnapshot()` from `packages/core`.

This is not optional. The test suite asserts that every snapshot in every scenario passes validation. If a change to the engine or a scenario produces an invalid snapshot, the tests fail.

This is the guarantee that simulation data is structurally identical to live data. The same validator, the same rules, the same invariants. A component that renders correctly with a validated live snapshot will render correctly with a validated simulated snapshot.

The simulation does not have separate, looser validation rules. It does not bypass invariants. It does not produce "approximately valid" data that is close enough for display purposes.

---

## What Simulation Enables

### Storybook

The most immediate use: Storybook stories can run complete simulated days instead of holding static snapshots.

`useSimulationMode(day, { minutesPerSecond })` advances through a `SimulatedDay` in real time, feeding reactive snapshot and insight values to any component that accepts them. A component under development can be watched cycling through every energy state it will ever display — charging, exporting, discharging, grid importing — without opening Home Assistant.

Every component story should eventually have a simulation variant showing it across a complete day, not just the states the developer thought to hand-craft.

### Demo mode

The full Cardinal application should be able to run against simulated data.

This means: connecting the `useHistoryStore` to a `SimulationProvider` (a future implementation of `IHistoricalSnapshotProvider`) instead of to Home Assistant. The application behaves normally — live updates, animations, insights, financials — but the data comes from the engine.

Demo mode enables:

- Marketing and sales demonstrations without a real home.
- Evaluation by potential users who have not yet installed the integration.
- Trade show and conference exhibits.
- Documentation screenshots taken from a controlled state.

### Documentation

Documentation screenshots should never come from a real home.

A real home changes. The battery is at a different percentage tomorrow. The export volume varies by season. Screenshots taken from live data become stale and inaccurate over time.

Screenshots taken from simulation are reproducible. A screenshot for the Storybook story "Simulated — Sunny Summer Day at 12:00" will look identical when retaken next year, provided the scenario and the components are unchanged. If either changes, the screenshot changes intentionally and the change is visible in the diff.

The simulation engine is the canonical source for all documentation imagery.

### Regression testing

When business logic changes — a new insight type, a revised financial calculation, a corrected energy description — regression tests must verify that the change has the expected effect and no unexpected side effects.

Simulation provides the input corpus. A suite of snapshot tests can assert, for every minute of every scenario, that the insight title is a known string, the financial calculation is within bounds, and the energy description matches a known template. Any change that breaks this suite is surfaced immediately, with the exact scenario and timestamp that failed.

This is particularly important for the insight engine, which maps from `EnergySnapshot` to `EnergyInsight`. Simulated days exercise every insight type repeatedly, covering edge cases that would be difficult to construct manually.

### Performance testing

`buildDay()` produces 1440 snapshots per scenario in well under a millisecond. A suite of simulated days can feed a rendering performance test that exercises every component state in sequence, measuring frame timing and detecting regressions in render performance before they reach users.

This is not achievable with live data, which arrives at the cadence of Home Assistant updates (typically every 30 seconds).

### Time Travel

When the Time Travel UI is built, users will be able to scrub through a historical timeline of their home's energy behaviour. The history store accepts snapshots from `IHistoricalSnapshotProvider`.

The simulation engine can back this interface in two ways:

1. **Demo and onboarding**: Users who have not yet accumulated historical data can explore simulated days to understand what the interface will show once their home has data.
2. **Scenario exploration**: Users can select a named scenario and explore it as if it were their home's history. "What would a summer day with a larger battery have looked like for my home?"

The simulation does not replace real historical data. It fills the absence of it.

---

## Future Home Modelling

The current simulation models a home with solar, battery, and grid. As Cardinal expands, the simulation must expand with it.

Each new module — EV charging, heat pumps, water heating, gas — requires:

1. A physical model for that device's energy behaviour.
2. Integration into the energy balance.
3. Representation in the domain model.
4. Corresponding scenario parameters.

The simulation engine is the proving ground for these models. Before a module ships to production, its energy behaviour must be correctably represented in the simulation and its scenarios must exercise the full range of states the module can produce.

### EV charging

EV charging is already modelled as an additional home load. A future improvement: smart charging profiles that respond to solar availability, time-of-use tariff windows, and battery state. The simulation should model both dumb (scheduled) and smart (solar-matched) charging strategies.

### Heat pumps

Heat pumps are temperature-dependent loads. Their power consumption varies with outdoor temperature and the target heating setpoint. A heat pump model requires a temperature profile alongside the energy profile. The simulation should eventually accept outdoor temperature as an input and produce a heat pump load that responds to it.

### Water heating

Immersion heaters and heat pump hot water cylinders are among the easiest solar-diversion loads to model. A stepped profile (the heater is either on or off at a fixed wattage) is sufficient for a first implementation.

---

## Modelling Guidance

### Solar profiles

The current solar model uses a sine bell curve between astronomical sunrise and sunset. This is a correct mathematical representation of ideal solar irradiance at a fixed panel angle on a cloudless day.

In practice, a UK solar system generates meaningfully less than the theoretical peak because:
- Panels are not oriented or tilted for maximum irradiance.
- Atmospheric scattering reduces early-morning and late-afternoon generation more than the sine curve suggests.
- Inverter efficiency degrades at low power levels.

The sine bell is appropriate for "clear sky" scenarios. It is explicitly a theoretical maximum, not a typical output. Scenarios should be labelled accordingly.

A future `WeatherProfile` abstraction will allow a solar profile to be scaled by an hour-by-hour cloud cover factor, producing more realistic and geographically specific outputs. The architecture must accommodate this without requiring changes to the engine's core dispatch logic.

### Battery modelling

The current battery model applies efficiency only on the charge side. Energy stored = charge power × efficiency. Discharge delivers exactly what is stored.

This is a reasonable first approximation but understates real round-trip losses. A future battery model should apply:

- Charge-side efficiency (current implementation: configurable, default 92%).
- Discharge-side efficiency.
- C-rate derating: maximum charge/discharge rate reduces as battery state of charge approaches its limits.
- Depth of discharge constraints: many batteries reserve 10–20% as a hard floor to protect cell longevity.

These parameters should be part of `SimulationBatteryConfig` when they are introduced. They must be configurable, not hardcoded.

### Tariff modelling

The current tariff model is a function of time-of-day fraction. This is sufficient for flat and time-of-use tariffs.

A future tariff model must account for:

- **Day-of-week variation**: some tariffs have weekend rates.
- **Seasonal variation**: some tariffs change between summer and winter periods.
- **Dynamic tariffs (Octopus Agile)**: rates change every 30 minutes based on the wholesale market. These can only be represented accurately by injecting real or synthetic rate schedules, not a parameterised function.

The tariff function signature `(t: number) => TariffState` should evolve to `(timestamp: Date) => TariffState` so that date-aware rates are possible. The `t` parameter is a convenience approximation that should not be baked into the long-term API.

---

## Reproducibility

A simulation scenario is fully defined by:

1. A `SimulationScenario` — the physical description of the home.
2. A `Date` — the calendar day being simulated.
3. (Future) A seed — for any stochastic elements.

Nothing else. No environment variables. No external state. No network calls.

The `ScenarioParameters` interface (described below in Architecture) is the serialisable form of a scenario. A scenario stored as `ScenarioParameters` can be transmitted, saved to disk, embedded in a URL, or reproduced from documentation without requiring access to the source code that defined it.

This is the reproducibility contract: anyone with the parameters and the engine version can reproduce any output exactly.

---

## User-Configurable Scenarios

Eventually, users should be able to define their own scenarios.

> "What would my bills have looked like if my battery were 15 kWh instead of 10 kWh?"
>
> "What would an EV charging overnight do to my grid import?"

These questions require the simulation to run against a user-specified configuration, not just the built-in scenarios.

For this to be possible, scenarios must be serialisable data. The `SimulationScenario` interface currently uses JavaScript function callbacks for profiles. Functions cannot be serialised to JSON, transmitted across a network, or stored in a database.

The `ScenarioParameters` interface addresses this by expressing everything the engine needs as plain data: solar peak watts, sunrise/sunset hours, home load profile amplitudes, battery configuration, tariff rates. The engine converts parameters into profile functions internally. Users interact only with the data; functions are an implementation detail.

---

## Architecture

### Current state

```
packages/simulation/
  src/
    types.ts         — SimulationScenario, SimulatedDay, SimulatedPoint, etc.
    profiles.ts      — solarBell(), standardHomeProfile(), flatTariff(), etc.
    engine.ts        — buildDay(scenario, date) → SimulatedDay
    scenarios.ts     — Seven named SimulationScenario instances
    engine.test.ts   — 38 tests covering balance, validity, battery, solar, at()
```

The engine is correct and the test coverage is good. The gaps are structural.

### Gap 1: Scenarios are not serialisable

`SimulationScenario` uses function callbacks for `solarProfile`, `homeProfile`, and `tariffs`. Functions cannot be serialised, versioned, transmitted, or user-edited.

**Resolution**: Introduce `ScenarioParameters` — a plain-data description of a scenario. Introduce `buildScenarioFromParameters(params)` to convert parameters into a `SimulationScenario`. Over time, the built-in scenarios should be expressed as `ScenarioParameters` first, with `buildScenarioFromParameters` constructing the function-based form.

### Gap 2: Multi-day state does not propagate

`buildDay()` reads `scenario.battery.initialChargePercent` for the starting battery state. If you call `buildDay()` twice for consecutive days, the second day ignores the battery state at the end of the first.

Real homes carry battery state forward. A full battery at 23:59 is still full at 00:00 the next day.

**Resolution**: `buildDay()` should accept an optional `DayState` argument containing the ending battery charge from the previous day. `SimulatedDay` should expose `endState: DayState` so callers can chain days without reaching into the points array.

### Gap 3: Tariff signature couples tariffs to time-of-day fractions

The `tariffs` function takes `t: number` where `t` is a fraction of the 24-hour day. This prevents date-aware tariffs (seasonal rates, day-of-week rates, Octopus Agile minute-level prices).

**Resolution**: Evolve toward `tariffs: (timestamp: Date) => TariffState`. This is a breaking change that should be deferred until a concrete use case requires it. For now, the limitation should be documented and the transition path should be obvious.

### Gap 4: No weather injection

The solar profile is a closed function. There is no way to inject external data — cloud cover, irradiance measurements, satellite data — into the profile computation.

**Resolution**: Introduce a `WeatherEnvelope` type: an array of hour-by-hour scale factors that multiply the base solar profile. `buildDay()` should accept an optional `WeatherEnvelope`. When provided, `solarProfile(t)` is scaled by `interpolate(envelope, t)`. When absent, the current behaviour applies.

### Gap 5: No scenario versioning

Scenarios will change over time. Tests that assert exact snapshot values against named scenarios will silently change meaning when a scenario changes.

**Resolution**: Scenarios should carry a `version` field. Test assertions that depend on exact scenario behaviour should pin the scenario version. Changes to a scenario's physical parameters must increment its version.

### What to build next

In priority order:

1. `ScenarioParameters` + `buildScenarioFromParameters()` — enables serialisability and user-configurable scenarios.
2. `DayState` + multi-day chaining — enables trajectory modelling.
3. `WeatherEnvelope` — enables realistic daily variation.
4. Scenario versioning — enables stable regression tests.
5. Stochastic profiles with seeded RNG — enables realistic load variation.

---

## What Simulation Is Not

**Not a forecasting engine.**

The simulation does not predict what a real home will do. It models what a hypothetical home with specified parameters would do under idealised conditions. A sunny summer day scenario does not predict tomorrow's generation — it describes a well-defined idealised day.

Forecasting requires real weather data, real historical consumption patterns, and probabilistic reasoning about future states. That is a separate capability and a separate product decision.

**Not a replacement for real data.**

Simulation is a substitute for real data when real data is unavailable — during development, in tests, in demos. Where real data exists, it should always be preferred.

A user's actual energy history is more meaningful than any simulated scenario, because it reflects their real home, their real tariffs, and their real consumption patterns. Simulation fills the gaps; it does not fill the role.

**Not a physics simulator.**

The engine is a simplified model. It does not simulate electrical circuits, inverter behaviour, DC bus dynamics, or cell-level battery chemistry. It models power flows at the system level, using aggregate watts and kWh, with simplified efficiency parameters.

The simplification is intentional. The goal is understandable, explainable energy behaviour — not engineering-grade accuracy. Every simplification should be documented so users and developers can understand where the model departs from physical reality.

---

## Summary

The simulation engine is not a convenience for developers.

It is the canonical source of deterministic energy behaviour in Cardinal.

Every future capability that requires a known energy state — testing, documentation, demo mode, Time Travel onboarding, home modelling, user-configurable what-if analysis — draws from the same engine, with the same physics, against the same invariants.

Building it well now means building it once.

The principle is the same one that governs Cardinal's product design: explain first, then display. The simulation explains what a home is doing — physically, causally, in detail — and the rest of Cardinal displays that explanation.
