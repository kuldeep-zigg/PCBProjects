#!/usr/bin/env node

/**
 * Single event-based CLI for all commands.
 * Usage: node cli.js <event> [args...]
 * Example: node cli.js search LM358
 *          node cli.js compile
 *          node cli.js integrate --verbose
 */

const path = require('path');
const { spawn } = require('child_process');

const root = __dirname;

const COMMANDS = {
  compile: { script: 'compiler-mvp.js', args: [] },
  integrate: { script: 'integrate.js', args: [] },
  'integrate:verbose': { script: 'integrate.js', args: ['--verbose'] },
  convert: { script: 'convert-to-easyeda.js', args: [] },
  download: { script: 'datasheet-downloader.js', args: [] },
  knowledge: { script: 'component-knowledge-loader.js', args: [] },
  auto: { script: 'auto-pcb-designer.js', args: [] },
  'auto:fast': { script: 'auto-pcb-designer-optimized.js', args: [] },
  status: { script: 'system-check.js', args: [] },
  harvest: { script: 'knowledge-harvester.js', args: ['harvest-all'] },
  learn: { script: 'learning-engine.js', args: ['cycle'] },
  evaluate: { script: 'learning-engine.js', args: ['evaluate'] },
  trend: { script: 'learning-engine.js', args: ['trend'] },
  report: { script: 'learning-engine.js', args: ['report'] },
  scrape: { script: 'chromium-scraper.js', args: ['search'] },
  'scrape:deep': { script: 'chromium-scraper.js', args: ['deep'] },
  'scrape:batch': { script: 'chromium-scraper.js', args: ['batch'] },
  'scrape:all': { script: 'chromium-scraper.js', args: ['alldatasheet'] },
  'scrape:google': { script: 'chromium-scraper.js', args: ['google'] },
  'scrape:follow': { script: 'chromium-scraper.js', args: ['follow'] },
  'scrape:history': { script: 'chromium-scraper.js', args: ['history'] },
  search: { script: 'product-search.js', args: [] },
  'search:ollama': { script: 'product-search.js', args: [], transform: (r) => r.length ? [r[0], '--ollama', ...r.slice(1)] : ['--ollama'] },
  'scrape:multi': { script: 'product-search.js', args: [] },
  test: { script: 'test/run-tests.js', args: [] },
  setup: { script: 'setup.js', args: [] },
  check: { script: null, custom: 'check' }
};

function run(scriptPath, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, ...env }
    });
    child.on('error', reject);
    child.on('exit', code => resolve(code));
  });
}

function usage() {
  const events = Object.keys(COMMANDS).join(', ');
  console.log('Usage: npm run run -- <event> [args...]  or  node cli.js <event> [args...]');
  console.log('Events: ' + events);
  console.log('Examples:');
  console.log('  npm run run -- compile');
  console.log('  npm run run -- integrate --verbose');
  console.log('  npm run run -- search LM358');
  console.log('  npm run run -- search:ollama LM358');
  console.log('  npm run run -- scrape LM358');
}

async function main() {
  const [,, event, ...rest] = process.argv;

  if (!event) {
    usage();
    process.exit(1);
  }

  const cmd = COMMANDS[event];
  if (!cmd) {
    console.error('Unknown event: ' + event);
    usage();
    process.exit(1);
  }

  if (cmd.custom === 'check') {
    console.log('✅ System ready!');
    const p = spawn('ollama', ['list'], { stdio: 'inherit' });
    p.on('exit', code => process.exit(code || 0));
    return;
  }

  const scriptPath = path.join(root, cmd.script);
  const args = typeof cmd.transform === 'function' ? cmd.transform(rest) : [...cmd.args, ...rest];

  const code = await run(scriptPath, args);
  process.exit(code || 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
