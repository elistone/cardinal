# HACS Readiness

This document tracks every requirement for Cardinal to be listed in the Home Assistant Community Store (HACS). It is intended to be worked through before the v1.0 release.

No HACS-specific behaviour has been implemented yet. This is a gap analysis only.

---

## Summary

| Area | Status |
| --- | --- |
| Repository layout | Needs work |
| `hacs.json` | Needs work |
| `manifest.json` | Needs work |
| License | Broken |
| Config flow strings | Missing |
| Release format | Ready |
| GitHub repository metadata | Needs work |

---

## Repository layout

HACS expects the integration to be reachable at `custom_components/<domain>/` from the repository root by default. Cardinal keeps its integration under `apps/integration/custom_components/cardinal/`, which is non-standard.

HACS provides a `zip_release` mode that bypasses the layout requirement entirely: instead of reading files from the repository tree, HACS downloads the ZIP from the GitHub release and installs from it. Cardinal's release ZIP already has the correct internal structure (`custom_components/cardinal/` at the archive root), so enabling `zip_release` solves the layout problem without restructuring the monorepo.

- [ ] Add `"zip_release": true` to `hacs.json`
- [ ] Move `hacs.json` from `apps/integration/hacs.json` to the **repository root**

The `hacs.json` at the root is how HACS discovers that the repository is a HACS-compatible integration. Its current location inside `apps/integration/` is invisible to HACS.

---

## `hacs.json`

Current contents (`apps/integration/hacs.json`):

```json
{
  "name": "Cardinal",
  "render_readme": true
}
```

Required state (at repository root):

```json
{
  "name": "Cardinal",
  "render_readme": true,
  "zip_release": true
}
```

- [ ] Move `hacs.json` to repository root
- [ ] Add `"zip_release": true`

`render_readme: true` is already correct — it tells HACS to render `README.md` as the store listing description rather than requiring a separate `info.md`.

---

## `manifest.json`

Current (`apps/integration/custom_components/cardinal/manifest.json`):

```json
{
  "domain": "cardinal",
  "name": "Cardinal",
  "version": "0.1.0",
  "documentation": "https://github.com/eli-stone/cardinal",
  "requirements": [],
  "dependencies": ["frontend"],
  "codeowners": [],
  "iot_class": "local_push",
  "config_flow": true
}
```

### Missing: `issue_tracker`

HACS validation requires an `issue_tracker` URL. Without it the integration fails HACS checks.

- [ ] Add `"issue_tracker": "https://github.com/eli-stone/cardinal/issues"`

### Missing: `codeowners`

`codeowners` is an empty array. HACS requires at least one GitHub username. An empty array causes HACS validation to fail.

- [ ] Add at least one GitHub username, e.g. `"codeowners": ["@eli-stone"]`

### Missing: minimum Home Assistant version

The Python `type` alias syntax (`type CardinalConfigEntry = ConfigEntry`) used in `__init__.py` requires Python 3.12, which shipped with Home Assistant 2024.1. The manifest does not declare this constraint, leaving users on older HA versions with a confusing startup error.

- [ ] Add `"homeassistant": "2024.1.0"` to declare the minimum supported HA version

### `documentation` URL

Currently points to the repository root (`https://github.com/eli-stone/cardinal`). This works, but a URL pointing directly to the installation guide would be better.

- [ ] Update `"documentation"` to point to the user-facing installation guide once it has a stable URL (e.g. GitHub Pages or a docs site)

---

## License

The `LICENSE` file at the repository root exists but is **empty** (0 bytes). HACS requires an open-source license. An empty file will cause HACS validation to fail.

- [ ] Choose a license (MIT is conventional for Home Assistant integrations)
- [ ] Write the full license text into `LICENSE`

---

## Config flow strings

Home Assistant expects config flow field labels to come from a `strings.json` file, not from the key names in the schema. Without `strings.json`, the setup form shows raw keys like `solar_power` instead of "Solar Power".

HACS does not strictly require `strings.json`, but the absence of it is a clear quality signal, and HACS validation warnings flag it.

Required files:

```
apps/integration/custom_components/cardinal/
  strings.json          ← labels shown in HA UI at build time
  translations/
    en.json             ← same content; shown at runtime
```

Example `strings.json` structure for Cardinal's config flow:

```json
{
  "config": {
    "step": {
      "user": {
        "title": "Configure Cardinal",
        "description": "Map your Home Assistant sensors to Cardinal concepts. Leave fields blank for sensors you do not have.",
        "data": {
          "solar_power": "Solar power",
          "battery_power": "Battery power (signed sensor)",
          "battery_charge_power": "Battery charge power",
          "battery_discharge_power": "Battery discharge power",
          "battery_state_of_charge": "Battery state of charge",
          "grid_power": "Grid power (signed sensor)",
          "grid_import_power": "Grid import power",
          "grid_export_power": "Grid export power",
          "home_consumption": "Home consumption",
          "solar_generated_today": "Solar generated today",
          "battery_charged_today": "Battery charged today",
          "battery_discharged_today": "Battery discharged today",
          "grid_imported_today": "Grid imported today",
          "grid_exported_today": "Grid exported today",
          "home_consumed_today": "Home consumed today",
          "import_rate": "Import rate",
          "export_rate": "Export rate",
          "currency": "Currency"
        },
        "data_description": {
          "battery_power": "Use this if your inverter provides a single sensor: positive = charging, negative = discharging.",
          "battery_charge_power": "Use this if your inverter provides separate charge and discharge sensors.",
          "grid_power": "Use this if your inverter provides a single sensor: positive = importing, negative = exporting.",
          "grid_import_power": "Use this if your inverter provides separate import and export sensors."
        }
      }
    }
  }
}
```

- [ ] Create `apps/integration/custom_components/cardinal/strings.json`
- [ ] Create `apps/integration/custom_components/cardinal/translations/en.json` with identical content

---

## Config flow reconfigure

The documentation instructs users to go to **Settings → Integrations → Cardinal → Reconfigure** to change entity mappings. However, `config_flow.py` does not implement `async_step_reconfigure`. Without this method, HA does not show the Reconfigure option.

Currently users must delete the integration and re-add it to change mappings, which loses their config entry history.

- [ ] Implement `async_step_reconfigure` in `CardinalConfigFlow` that pre-fills the form with the current `config_entry.data` values

---

## `async_unload_entry`

The current `async_unload_entry` implementation returns `True` without doing any cleanup:

```python
async def async_unload_entry(hass: HomeAssistant, entry: CardinalConfigEntry) -> bool:
    return True
```

When a config entry is removed, the sidebar panel remains registered until HA restarts. This is not a hard HACS requirement, but it is expected cleanup behaviour and will cause test failures if HACS integration tests are ever run against Cardinal.

- [ ] Call the appropriate HA panel deregistration in `async_unload_entry`

---

## Release format

Cardinal's release pipeline already meets HACS requirements for `zip_release` mode.

| Requirement | Status |
| --- | --- |
| Releases published to GitHub | ✓ |
| Release has a ZIP asset attached | ✓ |
| ZIP contains `custom_components/cardinal/` at root | ✓ |
| Tags use `v` + semver format (e.g. `v0.1.0`) | ✓ |
| `manifest.json` version matches the tag (enforced by CI) | ✓ |

No changes required here.

---

## GitHub repository metadata

HACS does not technically enforce these, but they affect discoverability and the quality signals HACS uses.

- [ ] Make the repository **public** before submitting to HACS
- [ ] Add GitHub repository topics: `homeassistant`, `home-assistant`, `hacs`, `custom-integration`, `energy`
- [ ] Write a meaningful repository description (the one-line description shown on GitHub and in HACS search results)
- [ ] Add a social preview image or repository icon (optional, but improves HACS store visibility)

---

## README.md

The existing `README.md` is good as a project overview but is missing content that HACS users expect.

Since `render_readme: true` is set in `hacs.json`, this README becomes the integration's store listing.

- [ ] Add a screenshot of the panel (one clear image of the live energy view)
- [ ] Add a short "Requirements" or "Supported inverters" section explaining the sensor conventions
- [ ] Add a link to the installation guide (`docs/manual-installation.md` or a hosted URL)
- [ ] Add a link to the troubleshooting guide

---

## HACS submission

When all items above are resolved:

1. Ensure the repository is public and the first tagged release is published
2. Open a pull request against [hacs/default](https://github.com/hacs/default) adding `cardinal` to the integrations list
3. HACS bot will run automated validation — all checks above must pass before the PR will be merged
4. Optionally, submit brand assets (logo, icon) to [hacs/brands](https://github.com/hacs/brands) for display in the HACS UI

---

## Checklist summary

### Blocking (HACS will reject without these)

- [ ] Move `hacs.json` to repository root
- [ ] Add `"zip_release": true` to `hacs.json`
- [ ] Add `"issue_tracker"` to `manifest.json`
- [ ] Add at least one entry to `"codeowners"` in `manifest.json`
- [ ] Write a real license into `LICENSE`

### Expected quality (flagged by HACS validation or HA quality checks)

- [ ] Create `strings.json` with config flow labels
- [ ] Create `translations/en.json` (same content)
- [ ] Add `"homeassistant": "2024.1.0"` to `manifest.json`
- [ ] Implement `async_step_reconfigure` in the config flow
- [ ] Fix `async_unload_entry` to deregister the panel

### Recommended (discoverability and user experience)

- [ ] Add a screenshot to `README.md`
- [ ] Add supported inverter types to `README.md`
- [ ] Add links to installation and troubleshooting docs in `README.md`
- [ ] Add GitHub repository topics
- [ ] Write a meaningful repository description on GitHub
- [ ] Make repository public before submission
