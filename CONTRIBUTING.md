# How to contribute a plugin or skill

Thanks for contributing to **agentify**. This guide covers adding a new plugin, adding a skill to an existing plugin, and the validation/PR flow.

## Prerequisites

- Node 18+.
- No `npm install` needed — all scripts use Node builtins only.

## Add a new plugin

```bash
node scripts/new-plugin.mjs <plugin-name>
```

This scaffolds:

- `<plugin-name>/` directory.
- `<plugin-name>/.claude-plugin/plugin.json` (Claude Code plugin manifest).
- `<plugin-name>/.cursor-plugin/plugin.json` (Cursor plugin manifest).
- An entry for the plugin registered automatically in both root marketplace files (`.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json`).

After scaffolding the plugin, add one or more skills with `new-skill.mjs`.

## Add a new skill to an existing plugin

```bash
node scripts/new-skill.mjs <plugin-name> <skill-name>
```

This scaffolds `<plugin-name>/skills/<skill-name>/SKILL.md` with YAML frontmatter pre-filled (you'll edit the `description` and body).

## Skill content guidelines

- `SKILL.md` must start with YAML frontmatter containing:
  - `name`: kebab-case identifier matching the directory name.
  - `description`: specific, mentions trigger keywords, written in third person (e.g. "Use when the user asks about ...").
- Keep `SKILL.md` under ~500 lines. For deeper reference material, add additional `.md` files in the same skill directory and link to them.
- Use markdown only. No executable code in `SKILL.md` — examples and snippets are fine, but the file itself is not run.

## Validation

Before opening a PR:

```bash
node scripts/validate.mjs
```

This checks both marketplace manifests, every plugin manifest, and every skill's frontmatter. CI runs the same script automatically on every PR.

## PR process

1. Fork the repo.
2. Create a branch.
3. Run the scaffold script(s), or edit files by hand.
4. Run `node scripts/validate.mjs` and fix any errors.
5. Open a PR. Automated review will run; address any feedback and merge.
