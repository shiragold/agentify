# TASKS

Living checklist for the agentify plugin marketplace.

## v1: turn this repo into a plugin marketplace

Goal: a markdown-based plugin marketplace installable from both Claude Code (`/plugin marketplace add shiragold/agentify`) and Cursor (manual clone or curated submission). Seed with the `css` plugin containing the `css-layout` skill.

### Scope decisions

- Marketplace `name`: `agentify` (in both manifests).
- Owner: `gold` <shira14@gmail.com>.
- Seed plugin: `css` (single domain, multiple skills planned).
- Seed skill: `css-layout` (already authored at `~/.cursor/skills/css-layout/`).
- Scripts: Node, no deps (uses only `node:` builtins).

### Tasks

- [x] Create `TASKS.md` (this file).
- [x] **A. Repo skeleton**
  - [x] `.claude-plugin/marketplace.json`
  - [x] `.cursor-plugin/marketplace.json`
  - [x] `README.md`
  - [x] `CONTRIBUTING.md`
- [x] **B. `css` plugin + `css-layout` skill**
  - [x] `css/.claude-plugin/plugin.json`
  - [x] `css/.cursor-plugin/plugin.json`
  - [x] `css/README.md`
  - [x] `css/skills/css-layout/SKILL.md` (ported, frontmatter has both `name` and `description`)
  - [x] `css/skills/css-layout/reference.md` (ported byte-identical)
- [x] **C. Scripts + CI**
  - [x] `scripts/new-plugin.mjs`
  - [x] `scripts/new-skill.mjs`
  - [x] `scripts/validate.mjs`
  - [x] `.github/workflows/validate.yml`
- [x] **Verification**
  - [x] `node scripts/validate.mjs` → `OK`.
  - [x] End-to-end scaffolding test passed (created `test-plugin`, added a skill, validator passed, then reverted).
  - [x] Error paths verified: kebab-case validation, duplicate plugin/skill detection, missing-plugin detection.

## Backlog (later)

- Submit to Cursor curated marketplace at https://cursor.com/marketplace/publish.
- Add more skills to `css` plugin (modern features, debugging, animations, etc.).
- Additional plugins for other domains (react, typescript, accessibility, ...).
- Logo/branding (`assets/logo.svg` in each plugin).
