# Cardinal Language Guide

Cardinal is an explanation engine. Its primary output is language. Everything in this document exists to ensure that language is consistent, honest, and clear.

---

## Writing Principles

### 1. Explain before you display

Every screen state begins with a sentence. Numbers and diagrams support that sentence — they do not replace it.

If a user could understand what is happening without reading the explanation, the explanation has been skipped. That is a failure.

> **Good:** "Your home is running entirely on solar."
>
> **Bad:** A flow diagram with numbers and no sentence.

### 2. Write from inside the home

Cardinal is a household product. Everything it describes is happening in the user's home, paid for with their money, using their equipment.

Use "your" consistently:
- "Your battery is charging."
- "Your home used 12 kWh today."
- "You generated more than you needed."

Never use "the system" or "the home" as a detached third-party reference. Cardinal is on the user's side.

### 3. Explanation first, evidence second

The headline states what is happening. The description explains why or what it means. The detail adds specifics.

Three tiers, in that order. Never lead with numbers.

> **Title:** Charging from Solar
>
> **Description:** Your battery is charging from excess solar.
>
> **Detail:** Battery is at 58% and rising.

### 4. One idea per sentence

Long sentences hide meaning. When two things are happening simultaneously, split them.

> **Good:** "Your battery is charging. Surplus solar is going to the grid."
>
> **Bad:** "Your battery is charging while simultaneously exporting surplus solar to the grid and providing approximately 1.8 kW to the home."

### 5. Be honest about what you know

Cardinal never estimates unless documented. If data is missing, say so plainly. "I don't know" is always better than a confident guess.

Do not hedge on high-confidence data. If sensors are healthy and the value is live, state it as fact.

> **Good:** "Battery is at 68%."
>
> **Bad:** "Battery appears to be at approximately 68%."

### 6. Calm is the default tone

Cardinal reports facts. It does not celebrate, alarm, or dramatise. Good solar days and grid-heavy days are reported with equal composure.

Reserve sentiment for genuinely useful signal — a positive card on a high-generation day, a neutral card during expected grid use. Never use sentiment theatrically.

---

## Tone of Voice

Cardinal sounds like a knowledgeable friend who happens to understand energy — not an engineer, not a salesperson.

**Calm.** Never excitable, never alarming.

**Direct.** State what is happening. Do not build up to it.

**Plain.** Use the simplest correct word. "Use" not "utilise." "Now" not "at this point in time."

**Warm but not chatty.** Cardinal is helpful, not social. It does not fill silence with cheerful padding.

**Honest.** If something is wrong, say what is wrong. Do not euphemise.

---

## Grammar Conventions

**Sentence case for descriptions and detail.** Capitalise only the first word and proper nouns.

> "Your battery is charging from excess solar."
> Not: "Your Battery Is Charging From Excess Solar."

**Title case for insight titles.** These are headings.

> "Charging from Solar"
> "Running on Battery"
> "Grid Overnight"

**Present tense for live state (NOW).** What is happening right now.

> "Your home is running on battery power."

**Past tense for daily summaries (TODAY).** What happened during the day.

> "You generated 18.4 kWh today."

**Active voice as the default.**

> "Your battery is charging from solar." — active
> "The battery is being charged." — passive (avoid unless necessary)

**No exclamation marks.** Cardinal never exclaims.

**Contractions are acceptable** in descriptions and detail lines.

> "You're generating more than you need." — acceptable
> "You are generating more than you need." — also acceptable but slightly more formal

**Numbers in descriptions** follow this rule: spell out round values under ten ("no grid use"), use numerals with units above ten ("1.8 kW", "18 kWh").

---

## Preferred Terminology

| Use | Avoid |
|---|---|
| solar | PV, photovoltaic, panels (alone) |
| battery | storage, storage system, accumulator |
| grid | mains, national grid |
| import, importing | draw, drawing from, pulling from |
| export, exporting | feed in, send back |
| charging | storing |
| excess solar | surplus generation, overproduction |
| your home | the load, the system, the property |
| energy rate, tariff rate | p/kWh (in copy; kWh is fine in metrics) |
| idle | standby (for grid specifically) |

**Units in metrics:** always `W` below 1,000; `kWh` for daily totals; format as `1.8 kW` (one decimal, space before unit).

**Battery state vocabulary:**
- Charging — the battery is receiving energy
- Discharging — the battery is supplying energy
- Standby — the battery is neither charging nor discharging (prefer "standby" over "idle" for battery; use "idle" for grid)

---

## Phrases to Avoid

**"Grid draw"** — sounds like a sports result. Use "grid use" or "grid import."

**"No solar generation"** — slightly passive. Use "No solar" or "The sun isn't generating right now."

**"Solar generation"** as a standalone — always qualify: "solar generation is..." or use "solar is generating."

**"The system"** — it is not a system. It is a home.

**"Real-time"** — redundant in a live dashboard. Everything shown is live by definition.

**"Please"** — Cardinal does not beg. State the action directly.

**"Configure your sensors"** — too technical as a standalone instruction. Pair with a specific path: "in Settings → Cardinal."

**"Data unavailable"** — too opaque. Say what is missing and why.

**"Detected"** or **"monitoring"** — surveillance language. Cardinal reads; it does not monitor.

---

## Energy Concepts in Plain English

These are the explanations Cardinal should reach for when describing energy states. Do not use the technical definitions.

**Solar generation:** The sun is producing electricity through the panels. When it is happening, write "solar is generating" or "your panels are producing." When it is not, "there's no solar right now" or "the sun isn't generating."

**Battery charging:** The battery is taking in energy and storing it. Write "your battery is charging" — not "the battery is being charged" or "storing energy."

**Battery discharging:** The battery is releasing its stored energy to power the home. Write "your battery is supplying your home" or "running on battery power."

**Grid import:** The home is drawing electricity from the public network. Write "importing from the grid" or "using grid power."

**Grid export:** Surplus electricity is being sent back to the public network. Write "sending surplus to the grid" or "exporting solar."

**Excess solar:** Solar is generating more electricity than the home needs at this moment. Write "excess solar" or "more solar than your home needs." Do not write "surplus generation."

**Battery at X%:** Describes how much stored energy remains. Always include the direction when it is relevant: "at 68% and rising" or "at 45% and discharging."

---

## NOW Insights

NOW insights describe what is happening at a specific moment. They are live, present-tense, and specific.

**Structure:**
1. **Title** (2–4 words, title case): States the dominant behaviour. "Charging from Solar." "Running on Battery." "Grid Overnight."
2. **Description** (1–2 sentences, sentence case): Explains what the title means in the user's home. Uses "your" and active voice.
3. **Detail** (1 sentence, optional): Adds one specific supporting fact — typically a number, a percentage, or a qualifying condition. Never adds a second main idea.

**When two things are happening,** the title and description address the more significant one. A detail line may acknowledge the second.

> "Your battery is charging from excess solar. Battery is at 68% and rising. Surplus solar is also going to the grid."

**The title is a phrase, not a sentence.** No full stop.

> "Charging from Solar" — correct
> "Charging from solar." — incorrect

**Description and detail are full sentences.** Each ends with a full stop.

**Sentiment** reflects the energy outcome, not the number:
- **Positive:** The home is self-sufficient, generating, or avoiding grid import.
- **Neutral:** The home is using the grid as expected, or in a mixed state.
- Neutral is not negative. Grid import at night is expected behaviour.

---

## TODAY Summaries

TODAY summaries describe what happened over the course of a day. They are past tense, accumulated, and factual.

**Labels** follow the pattern: `[source/destination] [verb in past tense]`.
- "Solar generated" — not "Solar generation"
- "Home consumed" — not "Home consumption"
- "Grid imported" — not "Grid import"
- "Grid exported" — not "Grid export"

**Financial summaries** describe the outcome in plain money terms:
- "Saved" — the money avoided by not importing solar-covered energy from the grid
- "Export earnings" — money received for electricity sent to the grid
- "Net benefit" — the total financial gain

The financial summary is always optional. When tariff rates are not configured, explain why and what to do:

> "To show savings, add your electricity rates in Settings → Cardinal."

Not:

> "Financial data is unavailable. Configure import and export tariff rates in settings."

---

## Future Narratives (Weekly and Monthly)

When weekly and monthly summaries are introduced, they should follow these conventions.

**Past tense throughout.** These describe completed periods.

**Trend over totals.** Patterns are more meaningful than raw numbers.

> "This week you avoided the grid on four out of seven days."
>
> Preferred over: "Total grid import: 3.2 kWh."

**Context makes numbers meaningful.** Compare against the user's own history, not industry averages.

> "Your best solar week this month."
>
> Not: "You generated 112 kWh, above the UK average."

**Narrative arc over the period.** A week has a shape — a run of overcast days, a good run of solar. The summary should reflect that arc, not just total the numbers.

> "Monday and Tuesday were mostly cloudy — you relied on the grid. From Wednesday onwards, solar covered most of your needs."

**Financial summaries in weekly/monthly contexts** emphasise what the user kept rather than what they earned.

> "You avoided £14.20 in import costs this week."
>
> Not: "Import savings: £14.20."

---

## System States

### Connecting (loading)

Cardinal is waiting for data. The interface shows skeletons. No copy is needed unless the user has been waiting unusually long — which is not yet handled.

### Disconnected

The connection to Home Assistant has been lost. Stale data is shown dimmed. The banner reads:

> "Reconnecting to Home Assistant…"

"Home Assistant" is always written in full — never "HA" in user-facing copy.

### No data after reconnect

When disconnected with no prior data:

> "Waiting for your home's data to arrive."

### Not configured

Cardinal has no sensor entities mapped. The screen reads:

> "Cardinal isn't connected to your home yet. To get started, tell it which energy sensors to read."

Followed by the specific navigation path:

> "Go to Settings → Integrations → Cardinal in Home Assistant to configure your sensors."

---

## Examples

### Good copy

> **Charging from Solar**
>
> Your battery is charging from excess solar. Battery is at 68% and rising.

Why it works: present tense, first-person home, one idea in the description, one supporting fact in detail.

---

> **Running on Battery**
>
> Your home is running on battery power. The grid is idle.

Why it works: states the behaviour, confirms the grid outcome without technical jargon.

---

> **Solar Assist**
>
> Solar is covering part of your home's energy. The rest is coming from the grid.
>
> Generating 1.4 kW, importing 620 W from the grid.

Why it works: two facts, each given a sentence, not crammed into one.

---

> **Grid Overnight**
>
> Your home is running on grid power. The battery is resting.
>
> Solar picks up again at sunrise.

Why it works: calm, unsensational, a single forward-looking note without false precision.

---

### Bad copy

> **Solar Exporting! 🌞**
>
> Your PV system is generating above the baseload demand threshold. Excess generation is being fed back into the grid at the current SEG rate.

Why it fails: exclamation mark, emoji, PV jargon, "baseload demand threshold" is meaningless to a homeowner, "SEG rate" requires prior knowledge, passive voice throughout.

---

> **Battery: 68% SOC**
>
> Charge/discharge rate: +1348W. Grid: 0W. Solar: 3600W.

Why it fails: SOC is an abbreviation, there is no explanation, the numbers have no context, +/- notation requires interpretation.

---

> **Everything looks great!**
>
> Your system seems to be running well. Looks like you're generating quite a bit of solar today!

Why it fails: exclamation marks, "seems to be" hedges a high-confidence fact, "quite a bit" is vague, no specific information.

---

## Accessibility

**Readability target:** Aim for Flesch-Kincaid Grade 7 or below in all user-facing copy. This corresponds roughly to a 12-year-old's reading level and is the standard for plain language in public services.

**Avoid jargon** even when the audience is technically literate. Technical users will understand plain language. Plain-language users will not understand technical language.

**Spell out what changed.** Screen reader users experience live regions as spoken text. "Battery is at 68% and rising" reads well aloud. "68%↑" does not.

**Number formatting:** Always use digits for measurements (68%, 1.8 kW). Always include the unit — a number without a unit is ambiguous in speech.

**Direction words:** "Charging", "Discharging", "Importing", "Exporting" are all clear when spoken aloud. Avoid arrows or symbols as the sole direction indicator.

**Status changes** in the NOW panel are announced via `aria-live`. Write detail lines as complete sentences so the spoken announcement is grammatical: "Battery is at 68% and rising." — not "68% ↑ rising."

**Loading states:** Never announce "Loading…" in a live region — it creates noise. Use `aria-busy` on the parent and let the resolved content speak for itself.

**Error and unavailable states:** Be specific. "Solar data isn't available" is better than "Error" or "—" alone. When the metric card shows an em dash, the screen reader announcement reads the label and status: "Solar generation: unavailable."
