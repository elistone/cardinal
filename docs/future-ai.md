# Future AI Features

This document captures AI-powered ideas that are **intentionally out of scope for v1**. They are recorded here because some of them have implications for how v1 should be structured, even if the features themselves will not ship yet.

Nothing in this document should be implemented in v1. It is a north star, not a backlog.

---

## Why Document This Now

AI features in energy management are not speculative. They are the natural evolution of the explanation engine Cardinal is becoming.

If v1 architecture decisions make these features impossible or very expensive to add later, we will have made the wrong choices. This document exists to make those tradeoffs visible.

The principle: **v1 must not foreclose v2.**

---

## Feature Ideas

### 1. Predictive Insights

*"Your battery will run out by 3pm if current usage continues."*
*"Today's cloud cover will reduce expected solar generation by around 40%."*

Cardinal currently explains what is happening. Predictive insights explain what is about to happen.

**Inputs required:** weather forecast, time-of-day usage patterns, current battery state, solar curve model.

**v1 architecture implications:**
- The insight block should be structured to accept future, present, and past tense statements without layout changes
- Domain models should include timestamps alongside values so patterns can be computed later
- The `DailySummary` model should be extensible to include forecast fields without breaking consumers

---

### 2. Anomaly Detection

*"Your home is using significantly more power than usual for this time of day."*
*"Your battery discharged faster than expected overnight — something may be drawing power."*

Cardinal could learn expected usage patterns and surface deviations as insights.

**Inputs required:** historical usage data (not available in v1), baseline models per time-of-day or day-of-week.

**v1 architecture implications:**
- The insight block must support a "warning" or "anomaly" visual state without structural changes
- Store state should distinguish between normal and flagged conditions even if flagging is not implemented yet

---

### 3. Natural Language Querying

*"How much did I earn from exports last week?"*
*"When does my battery usually run out in winter?"*

A conversational interface layered on top of Cardinal's existing data model.

**Inputs required:** access to historical data, a structured query model over Cardinal domain objects.

**v1 architecture implications:**
- Domain models should be named and structured in plain English so they can be described to a language model without translation
- The `core` package's pure functions should be composable and discoverable — they may eventually be exposed as tools to an AI agent
- Avoid abbreviations in type names and function names

---

### 4. Tariff Optimisation Recommendations

*"Your energy tariff charges more between 4pm and 7pm. Consider pre-charging your battery before 4pm."*
*"You could save an estimated £15 this month by shifting your dishwasher to 11pm."*

Actionable recommendations based on tariff structure and usage patterns.

**Inputs required:** time-of-use tariff data (not in v1 scope), appliance-level consumption (beyond v1 scope), battery scheduler integration.

**v1 architecture implications:**
- The financial summary model should be designed to accept multiple tariff scenarios, not just a flat rate
- Insight structure should support a "recommended action" component even if no actions are generated in v1

---

### 5. Contextual Explanations of Unusual Readings

*"Your solar output is lower than usual — Met Office reports overcast skies in your area today."*
*"Grid import is higher than expected — your battery was in maintenance mode last night."*

Rather than reporting an anomaly, Cardinal explains it using contextual data from external sources.

**Inputs required:** weather API integration, HA device state context (battery mode, car charging status, etc.).

**v1 architecture implications:**
- The insight model should have a `context` field or equivalent to hold supporting explanation text without conflating it with the headline
- Provider architecture should be open to additional data sources beyond HA sensor subscriptions (e.g. a weather provider)

---

### 6. Weekly and Monthly Narratives

*"This was your best solar week of the year so far. You generated 40% more than last week."*

Cardinal's "today" summary extended to longer time horizons with comparative context.

**Inputs required:** historical daily summaries stored persistently.

**v1 architecture implications:**
- `DailySummary` snapshots should be structurally stable and serialisable — they should survive Cardinal updates without migration complexity
- The store should be designed so that historical data can be injected as an additional layer without restructuring the live data flow

---

## Architecture Guidelines Derived From This Document

These are the concrete v1 decisions implied by the features above:

1. **Insight model carries intent, not just text.** The insight object passed to the `InsightBlock` component should eventually carry structured metadata (type, severity, tense, context). Even if v1 only uses a headline and description, the shape should not preclude adding fields later.

2. **Domain models use full English names.** No abbreviations in type names or field names. A language model should be able to read `DailySummary.avoideImportCost` and understand what it means without a schema comment.

3. **Pure functions in `core` are the intelligence layer.** AI features will compose or call these functions. They must remain pure, well-named, and dependency-free. A future AI agent calling `calculateNetBenefit(summary)` is a realistic scenario.

4. **Provider architecture is open.** The provider interface should not assume HA is the only data source. A `WeatherProvider` or `TariffProvider` should be addable without modifying existing providers or the core package.

5. **Financial models support multiple tariff structures.** v1 uses a flat rate. The model should not be structurally flat-rate-only.
