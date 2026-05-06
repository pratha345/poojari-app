#!/usr/bin/env node
// scripts/test-all.js
// ─────────────────────────────────────────────────────────────────
// Orchestrates the full test run:
//   1. Start backend  (port 5000)
//   2. Start frontend (port 5173)
//   3. Wait until both are ready
//   4. Run Playwright E2E tests
//   5. Stop everything and exit with test exit code
// ─────────────────────────────────────────────────────────────────
'use strict';

const { spawn, execSync } = require('child_process');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────
const ROOT     = path.resolve(__dirname, '..');
const BACKEND  = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const E2E      = path.join(ROOT, 'e2e');

// ── Config ────────────────────────────────────────────────────────
const BACKEND_URL  = 'http://localhost:5000/api/health';
const FRONTEND_URL = 'http://localhost:5173';
const WAIT_TIMEOUT = 60_000; // ms — kill if servers don't start in 60 s
const IS_WINDOWS   = process.platform === 'win32';

// ── ANSI colours ──────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  cyan:   '\x1b[36m',
};

const tag  = (color, name) => `${color}${C.bold}[${name}]${C.reset}`;
const info = (name, color, msg) => console.log(`${tag(color, name)} ${msg}`);

// ── Process registry ──────────────────────────────────────────────
const procs = [];

function registerProc(proc) {
  procs.push(proc);
  return proc;
}

function killAll() {
  procs.forEach(p => {
    if (p && !p.killed) {
      // On Windows, use taskkill to ensure the whole process tree is killed
      if (IS_WINDOWS && p.pid) {
        try {
          execSync(`taskkill /PID ${p.pid} /T /F`, { stdio: 'ignore' });
        } catch { /* already dead */ }
      } else {
        p.kill('SIGTERM');
      }
    }
  });
}

// Graceful shutdown on Ctrl+C / SIGTERM
process.on('SIGINT',  () => { killAll(); process.exit(130); });
process.on('SIGTERM', () => { killAll(); process.exit(143); });
process.on('exit',    ()  => killAll());

// ── Spawn helper ──────────────────────────────────────────────────
function startProc(label, color, cmd, args, cwd) {
  const proc = spawn(cmd, args, {
    cwd,
    shell: IS_WINDOWS,
    stdio: 'pipe',
    env:   { ...process.env, FORCE_COLOR: '1', NODE_ENV: 'development' },
  });

  proc.stdout.on('data', chunk =>
    process.stdout.write(`${tag(color, label)} ${chunk}`)
  );
  proc.stderr.on('data', chunk =>
    process.stderr.write(`${tag(color, label)} ${chunk}`)
  );
  proc.on('error', err =>
    info(label, C.red, `Process error: ${err.message}`)
  );
  proc.on('close', code => {
    if (code && code !== 0) {
      info(label, C.red, `Exited with code ${code}`);
    }
  });

  return registerProc(proc);
}

// ── wait-on wrapper ───────────────────────────────────────────────
function waitForServers() {
  info('WAIT', C.yellow, `Waiting for servers (timeout: ${WAIT_TIMEOUT / 1000}s)…`);
  info('WAIT', C.yellow, `  → Backend:  ${BACKEND_URL}`);
  info('WAIT', C.yellow, `  → Frontend: ${FRONTEND_URL}`);

  try {
    execSync(
      [
        IS_WINDOWS ? 'npx.cmd' : 'npx',
        'wait-on',
        `--timeout ${WAIT_TIMEOUT}`,
        '--interval 1000',
        '--window 500',
        `"${BACKEND_URL}"`,
        `"${FRONTEND_URL}"`,
      ].join(' '),
      { stdio: 'inherit', cwd: ROOT, shell: true }
    );
    info('WAIT', C.green, '✅ Both servers are ready!');
  } catch {
    throw new Error(
      `Servers did not become available within ${WAIT_TIMEOUT / 1000} seconds.\n` +
      `Make sure nothing else is using ports 5000 and 5173.`
    );
  }
}

// ── Playwright runner ─────────────────────────────────────────────
function runE2E() {
  info('E2E', C.cyan, 'Starting Playwright tests…');
  try {
    execSync(
      IS_WINDOWS ? 'npx.cmd playwright test' : 'npx playwright test',
      { cwd: E2E, stdio: 'inherit', shell: true }
    );
    return 0;
  } catch (err) {
    return typeof err.status === 'number' ? err.status : 1;
  }
}

// ── Banner ────────────────────────────────────────────────────────
function banner() {
  console.log(`
${C.cyan}${C.bold}╔══════════════════════════════════════════════════╗
║          पूजारी — Full E2E Test Runner            ║
║                                                  ║
║  Backend  → http://localhost:5000                ║
║  Frontend → http://localhost:5173                ║
╚══════════════════════════════════════════════════╝${C.reset}
`);
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  banner();

  // ── 1. Start backend ────────────────────────────────────────────
  info('BACKEND', C.blue, `Starting on port 5000…  (cwd: ${BACKEND})`);
  startProc(
    'BACKEND', C.blue,
    IS_WINDOWS ? 'node.exe' : 'node',
    ['src/app.js'],
    BACKEND
  );

  // ── 2. Start frontend ────────────────────────────────────────────
  info('FRONTEND', C.magenta, `Starting Vite on port 5173…  (cwd: ${FRONTEND})`);
  startProc(
    'FRONTEND', C.magenta,
    IS_WINDOWS ? 'npx.cmd' : 'npx',
    ['vite', '--port', '5173'],
    FRONTEND
  );

  let exitCode = 1;

  try {
    // ── 3. Wait for both servers ───────────────────────────────────
    waitForServers();

    // ── 4. Run E2E suite ──────────────────────────────────────────
    exitCode = runE2E();

  } catch (err) {
    info('ERROR', C.red, err.message);
    exitCode = 1;
  } finally {
    // ── 5. Cleanup ────────────────────────────────────────────────
    info('CLEANUP', C.yellow, 'Stopping backend and frontend…');
    killAll();
  }

  // ── Result ───────────────────────────────────────────────────────
  if (exitCode === 0) {
    console.log(`\n${C.green}${C.bold}✅  All E2E tests passed!${C.reset}\n`);
  } else {
    console.log(`\n${C.red}${C.bold}❌  Tests finished with failures (exit: ${exitCode})${C.reset}\n`);
  }

  process.exit(exitCode);
}

main().catch(err => {
  console.error(`\n${C.red}Fatal: ${err.message}${C.reset}\n`);
  killAll();
  process.exit(1);
});
