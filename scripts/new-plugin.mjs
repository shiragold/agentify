#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEBAB = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;
const AUTHOR = { name: 'gold', email: 'shira14@gmail.com' };

function fail(msg, code = 1) {
  console.error(`error: ${msg}`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--description' || a === '--version' || a === '--category' || a === '--keywords') {
      const v = argv[++i];
      if (v === undefined) fail(`missing value for ${a}`);
      args[a.slice(2)] = v;
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

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const name = args._[0];
  if (!name) fail('usage: node scripts/new-plugin.mjs <plugin-name> [--description "..."] [--version 1.0.0] [--category cat] [--keywords k1,k2,k3]');
  if (!KEBAB.test(name)) fail(`plugin name must be kebab-case: ${name}`);

  const pluginDir = path.join(REPO_ROOT, name);
  if (fs.existsSync(pluginDir)) fail(`directory already exists: ${name}/`);

  const claudeMarketPath = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
  const cursorMarketPath = path.join(REPO_ROOT, '.cursor-plugin', 'marketplace.json');
  if (!fs.existsSync(claudeMarketPath)) fail(`missing ${path.relative(REPO_ROOT, claudeMarketPath)}`);
  if (!fs.existsSync(cursorMarketPath)) fail(`missing ${path.relative(REPO_ROOT, cursorMarketPath)}`);

  const claudeMarket = readJSON(claudeMarketPath);
  const cursorMarket = readJSON(cursorMarketPath);
  const claudePlugins = Array.isArray(claudeMarket.plugins) ? claudeMarket.plugins : [];
  const cursorPlugins = Array.isArray(cursorMarket.plugins) ? cursorMarket.plugins : [];
  if (claudePlugins.some((p) => p.name === name)) fail(`plugin "${name}" already in .claude-plugin/marketplace.json`);
  if (cursorPlugins.some((p) => p.name === name)) fail(`plugin "${name}" already in .cursor-plugin/marketplace.json`);

  let description = args.description;
  if (!description) {
    description = (await prompt(`Description for "${name}": `)).trim();
  }
  if (!description) fail('description is required');

  const version = args.version || '0.1.0';
  const category = (args.category || '').trim();
  const keywords = (args.keywords || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const manifest = {
    name,
    description,
    version,
    author: AUTHOR,
    license: 'MIT',
  };
  if (keywords.length) manifest.keywords = keywords;

  fs.mkdirSync(path.join(pluginDir, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(pluginDir, '.cursor-plugin'), { recursive: true });
  fs.mkdirSync(path.join(pluginDir, 'skills'), { recursive: true });

  writeJSON(path.join(pluginDir, '.claude-plugin', 'plugin.json'), manifest);
  writeJSON(path.join(pluginDir, '.cursor-plugin', 'plugin.json'), manifest);
  fs.writeFileSync(path.join(pluginDir, 'skills', '.gitkeep'), '');

  const readme = `# ${name}\n\n${description}\n\n## Skills\n\n_No skills yet. Add one with_ \`node scripts/new-skill.mjs ${name} <skill-name>\`.\n`;
  fs.writeFileSync(path.join(pluginDir, 'README.md'), readme);

  const claudeEntry = { name, source: `./${name}`, description };
  const cursorEntry = { name, source: name, description };
  if (category) { claudeEntry.category = category; cursorEntry.category = category; }
  if (keywords.length) { claudeEntry.keywords = keywords; cursorEntry.keywords = keywords; }

  claudeMarket.plugins = [...claudePlugins, claudeEntry];
  cursorMarket.plugins = [...cursorPlugins, cursorEntry];
  writeJSON(claudeMarketPath, claudeMarket);
  writeJSON(cursorMarketPath, cursorMarket);

  console.log(`Created plugin "${name}" at ${name}/`);
  console.log(`Registered in .claude-plugin/marketplace.json and .cursor-plugin/marketplace.json`);
  console.log('');
  console.log('Next steps:');
  console.log(`  Run \`node scripts/new-skill.mjs ${name} <skill-name>\` to add a skill.`);
}

main().catch((err) => {
  console.error(`unexpected error: ${err && err.stack || err}`);
  process.exit(2);
});
