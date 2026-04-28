# agentify

An agent-agnostic markdown plugin marketplace. Plugins here are plain markdown skills, rules, and agents that work with both Claude Code and Cursor — and can be read directly by any other tool that understands markdown with YAML frontmatter.

## Available plugins

- `css` — CSS skills (layout fundamentals, more coming).

## Install

### Claude Code

```bash
/plugin marketplace add shiragold/agentify
/plugin install css@agentify
```

Update later with:

```bash
/plugin marketplace update
```

### Cursor

Cursor does not currently have an `add-from-URL` CLI for marketplaces. Two options:

1. **Manual clone** into Cursor's plugin directory:

   ```bash
   git clone https://github.com/shiragold/agentify.git ~/.cursor/plugins/agentify
   ```

   Cursor reads plugins from `~/.cursor/plugins/`.

2. **Submit / wait for the curated marketplace** at <https://cursor.com/marketplace/publish>. We plan to publish there.

### Any other agent

Clone the repo and read `<plugin>/skills/<skill>/SKILL.md` files directly. They are plain markdown with YAML frontmatter, so any agent (or human) can consume them without special tooling.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The canonical way to add a plugin or skill is via the scaffolding scripts:

- `scripts/new-plugin.mjs` — create a new plugin and register it in both marketplace manifests.
- `scripts/new-skill.mjs` — add a new skill to an existing plugin.

## Repo layout

```
.
├── .claude-plugin/    # Claude Code marketplace manifest
├── .cursor-plugin/    # Cursor marketplace manifest
├── css/               # CSS plugin (skills + per-agent plugin manifests)
└── scripts/           # Scaffolding and validation scripts (Node, no deps)
```

## License

MIT — see [LICENSE](./LICENSE).
