# CLAUDE.md

# Cardinal Development Guide

Welcome to Cardinal.

This document is the first thing you should read before making changes to the project.

Cardinal is not simply another Home Assistant dashboard.

It is an **energy explanation engine**.

The goal is not to display more numbers.

The goal is to explain, in plain English, what is happening in the user's home, why it is happening, and what it means.

Every architectural decision should support that goal.

---

# Project Philosophy

Cardinal should answer one question better than anything else:

> **"What is happening in my home right now, and what has happened today?"**

Everything else is secondary.

Whenever introducing a feature ask yourself:

* Does this make the system easier to understand?
* Does this reduce confusion?
* Does this explain something rather than simply visualising it?

If the answer is "no", reconsider the feature.

---

# Product Principles

Cardinal is built around these principles.

## Explain first

Users should not need to understand power flows.

Cardinal should explain them.

Good:

> Battery charging from excess solar.

Bad:

> Battery
>
> +1842W

---

## Numbers support explanations

Metrics exist to reinforce the explanation.

Never make numbers the primary focus.

---

## Every calculation must be explainable

Nothing should feel like magic.

Every value shown to the user should be traceable back to:

* Home Assistant entities
* Core calculations
* Documented assumptions

If something cannot be explained, it should not be shown.

---

## Honest over clever

Never invent information.

Never estimate unless explicitly documented.

Always prefer:

"I don't know."

over

"I think..."

---

# Architecture Principles

Business logic must never depend on Vue.

Business logic must never depend on Home Assistant.

Business logic must never depend on the UI.

Providers translate Home Assistant data into Cardinal models.

Everything above the provider layer should be platform independent.

---

# Package Responsibilities

packages/domain

Single source of truth for every domain model.

Contains:

* EnergySnapshot
* DailySummary
* EnergyInsight
* EnergyEvent
* ConfigurationHealth

No business logic.

No Home Assistant knowledge.

---

packages/providers

Responsible for:

* Home Assistant WebSocket
* Entity translation
* Configuration assessment

Providers output Cardinal models.

They never expose Home Assistant entities.

---

packages/core

Contains all business logic.

Examples:

* Calculations
* Insight generation
* Financial calculations
* Event detection

Pure TypeScript.

No Vue.

No Home Assistant.

---

packages/ui

Reusable Vue components only.

Components present data.

They do not calculate data.

---

apps/frontend

Application composition.

Pinia.

Routing.

Panel initialisation.

No business logic.

---

apps/integration

Thin Python bridge.

Responsible only for:

* Config Flow
* Panel registration
* Asset serving
* Passing configuration into the frontend

Keep this layer as small as possible.

---

# Testing Philosophy

Everything should be tested.

Every bug should produce a regression test.

Never fix a bug without adding a test that would have caught it.

---

## Test hierarchy

Unit tests

Fast.

Pure functions.

Highest coverage.

---

Integration tests

Real Home Assistant fixture data.

These are considered the source of truth.

If fixture behaviour changes intentionally:

Update the fixture.

Do not weaken the assertions.

---

Storybook

Every reusable component should have stories covering:

* Loading
* Normal
* Empty
* Error
* Unavailable

Stories should use realistic fixture data.

---

# Coding Principles

Prefer explicit code.

Avoid clever abstractions.

Avoid unnecessary generics.

Avoid premature optimisation.

Readable code wins.

---

If something feels repetitive but obvious:

Keep it repetitive.

Future maintainers will thank you.

---

# Performance Principles

Performance matters.

Readability matters more.

Optimise only after measurement.

---

Avoid:

* unnecessary watchers
* unnecessary reactivity
* unnecessary object allocations
* unnecessary renders

---

# UI Principles

Animations should communicate.

Not decorate.

Movement should indicate:

* direction
* flow
* transition
* emphasis

Never animate simply because it looks nice.

---

Accessibility is a feature.

Everything should work with:

* keyboard
* screen readers
* reduced motion

---

# Home Assistant

Home Assistant is an integration.

Not the product.

Do not leak Home Assistant concepts into the domain layer.

Examples of Home Assistant concepts:

* entity_id
* state objects
* hass
* WebSocket payloads

These belong inside providers only.

---

# Documentation

Whenever architecture changes:

Update the documentation.

Whenever behaviour changes:

Update the fixtures.

Whenever a bug is fixed:

Add a regression test.

Documentation is part of the implementation.

---

# Git

Small commits.

Clear commit messages.

Keep history readable.

---

# Future Features

Future modules may include:

* Water
* Gas
* EV charging
* Heating
* Air quality

The architecture should make this possible without changing existing packages.

Do not build these until required.

---

# What Not To Build

Do not recreate the Home Assistant Energy Dashboard.

Do not recreate Grafana.

Do not create charts simply because data exists.

Cardinal exists to explain.

---

# Definition of Done

A feature is complete when:

* Architecture follows project principles.
* Business logic is tested.
* Components have Storybook stories.
* Documentation is updated.
* Integration tests pass.
* CI passes.
* The feature makes the user's home easier to understand.

Not before.

---

# When Unsure

Choose:

Simple over clever.

Explicit over implicit.

Readable over compact.

Tested over assumed.

Explained over visualised.

The best Cardinal feature is one that helps a user instantly understand what their home is doing.

# Working Style

When implementing features:

1. Think before coding.
2. If architecture needs changing, update documentation first.
3. Write tests alongside implementation.
4. Never leave TODOs unless explicitly agreed.
5. If you discover a better architecture, explain why before implementing it.
6. Prefer extending existing patterns over introducing new ones.
7. If a decision affects future architecture, document it in an RFC.

When responding:

- Challenge assumptions if a better solution exists.
- Explain trade-offs.
- Do not make architectural changes silently.
- Ask for clarification only when genuinely blocked.
