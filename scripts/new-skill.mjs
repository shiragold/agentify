#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEBAB = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;

function fail(msg, code = 1) {
  console.error(`error: ${msg}`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--description') {
      const v = argv[++i];
      if (v === undefined) fail(`missing value for ${a}`);
      args.description = v;
    } else if (a.startsWith('--')) {
      fail(`unknown flag: ${a}`);
    } else {
      args._.push(a);
    }
  }
  return args;
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function toTitle(kebab) {
  return kebab
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [plugin, skill] = args._;
  if (!plugin || !skill) fail('usage: node scripts/new-skill.mjs <plugin> <skill-name> [--description "..."]');
  if (!KEBAB.test(plugin)) fail(`plugin name must be kebab-case: ${plugin}`);
  if (!KEBAB.test(skill)) fail(`skill name must be kebab-case: ${skill}`);

  const pluginDir = path.join(REPO_ROOT, plugin);
  if (!fs.existsSync(pluginDir) || !fs.statSync(pluginDir).isDirectory()) {
    fail(`plugin directory does not exist: ${plugin}/`);
  }
  const pluginManifest = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(pluginManifest)) {
    fail(`not a valid plugin (missing ${path.relative(REPO_ROOT, pluginManifest)})`);
  }

  const skillDir = path.join(pluginDir, 'skills', skill);
  if (fs.existsSync(skillDir)) fail(`skill directory already exists: ${plugin}/skills/${skill}/`);

  let description = args.description;
  if (!description) {
    description = (await prompt(`Description for "${skill}": `)).trim();
  }
  if (!description) fail('description is required');

  fs.mkdirSync(skillDir, { recursive: true });

  const title = toTitle(skill);
  const content = `---\nname: ${skill}\ndescription: ${description}\n---\n\n# ${title}\n\n<!-- TODO: write skill content here. See CONTRIBUTING.md for guidance. -->\n`;
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);

  const gitkeep = path.join(pluginDir, 'skills', '.gitkeep');
  if (fs.existsSync(gitkeep)) {
    try { fs.unlinkSync(gitkeep); } catch {}
  }

  console.log(`Created skill "${skill}" at ${plugin}/skills/${skill}/SKILL.md`);
}

main().catch((err) => {
  console.error(`unexpected error: ${err && err.stack || err}`);
  process.exit(2);
});
