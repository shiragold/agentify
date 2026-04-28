#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEBAB = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;

const errors = [];
function err(file, message) {
  errors.push({ file, message });
}

function rel(p) {
  return path.relative(REPO_ROOT, p) || '.';
}

function tryReadJSON(absPath) {
  if (!fs.existsSync(absPath)) {
    err(rel(absPath), 'file does not exist');
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(absPath, 'utf8'));
  } catch (e) {
    err(rel(absPath), `invalid JSON: ${e.message}`);
    return null;
  }
}

function validateMarketplace(absPath, kind) {
  const data = tryReadJSON(absPath);
  if (!data) return null;
  const file = rel(absPath);
  if (typeof data.name !== 'string' || !data.name) {
    err(file, 'missing or empty "name"');
  } else if (!KEBAB.test(data.name)) {
    err(file, `"name" must be kebab-case: ${data.name}`);
  }
  if (!data.owner || typeof data.owner !== 'object' || typeof data.owner.name !== 'string' || !data.owner.name) {
    err(file, 'missing "owner.name"');
  }
  if (!Array.isArray(data.plugins)) {
    err(file, 'missing "plugins" array');
    return null;
  }
  for (let i = 0; i < data.plugins.length; i++) {
    const p = data.plugins[i];
    if (!p || typeof p !== 'object') {
      err(file, `plugins[${i}] is not an object`);
      continue;
    }
    if (typeof p.name !== 'string' || !p.name) {
      err(file, `plugins[${i}] missing "name"`);
    }
    if (typeof p.source !== 'string' || !p.source) {
      err(file, `plugins[${i}] (${p.name || '?'}) missing "source"`);
    } else {
      if (kind === 'claude' && !p.source.startsWith('./')) {
        err(file, `plugins[${i}] (${p.name}) source should start with "./" for Claude: got "${p.source}"`);
      }
      if (kind === 'cursor' && p.source.startsWith('./')) {
        err(file, `plugins[${i}] (${p.name}) source should not start with "./" for Cursor: got "${p.source}"`);
      }
    }
  }
  return data;
}

function parseFrontmatter(content, file) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    err(file, 'must start with "---" YAML frontmatter');
    return null;
  }
  const rest = content.replace(/^---\r?\n/, '');
  const endIdx = rest.search(/\r?\n---\r?\n|\r?\n---\s*$/);
  if (endIdx === -1) {
    err(file, 'unterminated YAML frontmatter (missing closing "---")');
    return null;
  }
  const fm = rest.slice(0, endIdx);
  const out = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

function validateSkill(skillDir, skillName) {
  const file = rel(path.join(skillDir, 'SKILL.md'));
  const entries = fs.readdirSync(skillDir);
  const hasUpper = entries.includes('SKILL.md');
  const hasOther = entries.find((e) => e.toLowerCase() === 'skill.md' && e !== 'SKILL.md');
  if (!hasUpper) {
    if (hasOther) {
      err(rel(path.join(skillDir, hasOther)), `filename must be exactly "SKILL.md" (uppercase), got "${hasOther}"`);
    } else {
      err(file, 'missing SKILL.md');
    }
    return;
  }
  const content = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  const fm = parseFrontmatter(content, file);
  if (!fm) return;
  if (!fm.name) {
    err(file, 'frontmatter missing "name"');
  } else {
    if (!KEBAB.test(fm.name)) {
      err(file, `frontmatter "name" must be kebab-case: ${fm.name}`);
    }
    if (fm.name !== skillName) {
      err(file, `frontmatter "name" (${fm.name}) does not match parent directory (${skillName})`);
    }
  }
  if (!fm.description || !fm.description.trim()) {
    err(file, 'frontmatter "description" is missing or empty');
  }
}

function validatePlugin(pluginName) {
  const pluginDir = path.join(REPO_ROOT, pluginName);
  if (!fs.existsSync(pluginDir) || !fs.statSync(pluginDir).isDirectory()) {
    err(pluginName + '/', 'plugin directory does not exist');
    return;
  }

  for (const kind of ['claude', 'cursor']) {
    const manifestPath = path.join(pluginDir, `.${kind}-plugin`, 'plugin.json');
    const file = rel(manifestPath);
    const data = tryReadJSON(manifestPath);
    if (!data) continue;
    if (typeof data.name !== 'string' || !data.name) {
      err(file, 'missing "name"');
    } else if (data.name !== pluginName) {
      err(file, `"name" (${data.name}) does not match directory name (${pluginName})`);
    }
    if (typeof data.description !== 'string' || !data.description.trim()) {
      err(file, '"description" is missing or empty');
    }
  }

  const skillsDir = path.join(pluginDir, 'skills');
  if (fs.existsSync(skillsDir) && fs.statSync(skillsDir).isDirectory()) {
    for (const entry of fs.readdirSync(skillsDir)) {
      const sub = path.join(skillsDir, entry);
      if (!fs.statSync(sub).isDirectory()) continue;
      validateSkill(sub, entry);
    }
  }
}

function main() {
  const claudePath = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
  const cursorPath = path.join(REPO_ROOT, '.cursor-plugin', 'marketplace.json');

  const claude = validateMarketplace(claudePath, 'claude');
  const cursor = validateMarketplace(cursorPath, 'cursor');

  const claudeNames = claude && Array.isArray(claude.plugins) ? claude.plugins.map((p) => p && p.name).filter(Boolean) : [];
  const cursorNames = cursor && Array.isArray(cursor.plugins) ? cursor.plugins.map((p) => p && p.name).filter(Boolean) : [];

  const claudeSet = new Set(claudeNames);
  const cursorSet = new Set(cursorNames);
  for (const n of claudeSet) {
    if (!cursorSet.has(n)) {
      err('.cursor-plugin/marketplace.json', `plugin "${n}" present in Claude marketplace but missing from Cursor marketplace`);
    }
  }
  for (const n of cursorSet) {
    if (!claudeSet.has(n)) {
      err('.claude-plugin/marketplace.json', `plugin "${n}" present in Cursor marketplace but missing from Claude marketplace`);
    }
  }

  const allPlugins = new Set([...claudeNames, ...cursorNames]);
  for (const name of allPlugins) {
    if (!KEBAB.test(name)) {
      err('marketplace', `plugin name "${name}" is not kebab-case`);
      continue;
    }
    validatePlugin(name);
  }

  if (errors.length === 0) {
    console.log('OK');
    process.exit(0);
  }
  errors.forEach((e, i) => {
    console.error(`[error ${i + 1}] ${e.file}: ${e.message}`);
  });
  console.error('');
  console.error(`${errors.length} error(s)`);
  process.exit(1);
}

try {
  main();
} catch (e) {
  console.error(`unexpected error: ${e && e.stack || e}`);
  process.exit(2);
}
