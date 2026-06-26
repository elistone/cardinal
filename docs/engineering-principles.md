# Engineering Principles

These principles define how Cardinal is engineered.

## General

* TypeScript strict mode.
* Small, focused modules.
* Composition over inheritance.
* Readability over cleverness.
* Prefer explicit code over magic.

## Architecture

Business logic must never live inside Vue components.

Vue components are responsible for presentation only.

Calculations belong inside the core engine.

Providers are responsible only for obtaining data.

## Folder Responsibilities

apps/
Contains runnable applications.

packages/core/
Business logic.

packages/providers/
External integrations.

packages/types/
Shared types.

packages/ui/
Reusable UI components.

docs/
Project documentation.

## Dependencies

Dependencies should only be introduced when they solve a real problem.

Avoid large libraries for small tasks.

## State Management

Application state should have a single source of truth.

Avoid duplicated state.

## Naming

Prefer descriptive names over abbreviations.

Example:

calculateDailySavings()

Instead of:

calcDS()

## Testing

Business logic should be testable without Vue.

Pure functions are preferred whenever possible.

## Documentation

Every significant architectural decision should have an accompanying RFC.

## Pull Requests

Every pull request should:

* solve one problem
* remain focused
* avoid unrelated changes
* update documentation when required
