# Release Process

Cardinal uses git tags to trigger releases. Pushing a `v*` tag causes GitHub Actions to build, package, and publish the integration automatically.

---

## Prerequisites

- Push access to the repository
- A clean, passing main branch (CI green)

---

## How to release

### Step 1 — Update the manifest version

Edit `apps/integration/custom_components/cardinal/manifest.json` and bump the version:

```json
{
  "version": "0.2.0"
}
```

Follow [semantic versioning](https://semver.org):

| Change type | Example |
| --- | --- |
| Bug fix | `0.1.0` → `0.1.1` |
| New feature | `0.1.0` → `0.2.0` |
| Breaking change | `0.1.0` → `1.0.0` |

Commit the change:

```sh
git add apps/integration/custom_components/cardinal/manifest.json
git commit -m "bump version to 0.2.0"
git push
```

### Step 2 — Tag the commit

The tag must be `v` followed by exactly the version string in `manifest.json`. The release pipeline verifies this and will fail if they differ.

```sh
git tag v0.2.0
git push origin v0.2.0
```

### Step 3 — Wait for CI

The [Release workflow](../.github/workflows/release.yml) runs automatically:

1. Verifies the tag matches `manifest.json`
2. Runs lint, type-check, and tests
3. Builds the frontend (clean production build)
4. Produces `dist/cardinal-0.2.0.zip`
5. Creates a GitHub Release and attaches the ZIP

The release is visible at **GitHub → Releases** once the workflow completes (~2–3 minutes).

---

## What is in the release ZIP

The archive contains exactly:

```
custom_components/
  cardinal/
    __init__.py
    config_flow.py
    const.py
    manifest.json
    panel.py
    frontend/
      cardinal-panel.js
      assets/
        main-*.css
```

Users extract this at the root of their Home Assistant config directory. See [INSTALL.md](INSTALL.md) for the full installation guide.

---

## Building a package locally

You can produce the same ZIP locally without pushing a tag:

```sh
pnpm package
```

This builds a clean production bundle, then writes `dist/cardinal-{version}.zip`. Useful for testing the archive before releasing.

---

## If the release workflow fails

**Tag does not match manifest version**

```
Tag v0.2.0 does not match manifest version 0.1.0
```

Update `manifest.json` to match the tag, commit, delete the tag, and re-push:

```sh
# Fix manifest.json, then:
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0
git add apps/integration/custom_components/cardinal/manifest.json
git commit -m "bump version to 0.2.0"
git push
git tag v0.2.0
git push origin v0.2.0
```

**CI checks failed**

Fix the lint, type, or test errors on main, then delete and re-push the tag as above.

**GitHub Release action failed**

Check the workflow logs. If the ZIP was produced but the upload failed, you can manually create a release and attach `dist/cardinal-{version}.zip` via the GitHub UI.

---

## Changelog

Release notes are generated automatically from commits since the previous tag. Write commit messages that describe the user-visible effect, not the implementation:

Good:
```
fix: battery discharging insight now shows correct wattage
feat: add grid power signed-sensor support to config flow
```

Not useful:
```
update translate.ts
fix stuff
```
