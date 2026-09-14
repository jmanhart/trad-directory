#!/usr/bin/env node
// Runs automatically before `npm run dev:admin` (npm `pre` hook).
//
// Why this exists: Vite proxies `/api` to a FIXED port (API_PORT, default 3001)
// where `vercel dev` serves the serverless functions. If a stale dev server is
// still holding that port, `vercel dev` can't bind it and silently drifts to a
// different port — so the Vite proxy points at nothing and the app loads with
// EMPTY DATA and no error. Same story for the app port (5173).
//
// This preflight frees those ports (only killing dev-server processes, and only
// LISTENERS — never a browser tab connected to them) so startup is deterministic.
// If a non-dev process holds a port, it aborts with an actionable message instead
// of nuking something important.
const { execSync } = require("node:child_process");

const API_PORT = Number(process.env.API_PORT) || 3001;
const APP_PORT = Number(process.env.VITE_PORT) || 5173;

// Guard: only these look like our dev servers. Prevents killing an unrelated
// process that happens to hold the port.
const DEV_PROCESS = /(vite|vercel|esbuild|node)/i;

function listenersOnPort(port) {
  try {
    // -sTCP:LISTEN → only the process LISTENING on the port, not clients
    // (e.g. a browser tab) that merely have an open connection to it.
    return execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return []; // nothing listening → lsof exits non-zero
  }
}

function commandForPid(pid) {
  try {
    return execSync(`ps -p ${pid} -o command=`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

let aborted = false;
for (const [name, port] of [
  ["API_PORT", API_PORT],
  ["VITE_PORT", APP_PORT],
]) {
  for (const pid of listenersOnPort(port)) {
    const cmd = commandForPid(pid);
    if (DEV_PROCESS.test(cmd)) {
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(
          `[dev-preflight] freed port ${port} (stopped pid ${pid}: ${cmd.slice(0, 60)})`
        );
      } catch (err) {
        console.warn(
          `[dev-preflight] could not stop pid ${pid} on port ${port}: ${err.message}`
        );
      }
    } else {
      console.error(
        `[dev-preflight] port ${port} is held by a non-dev process (pid ${pid}):\n` +
          `    ${cmd}\n` +
          `  Stop it, or set ${name} to a free port before starting.`
      );
      aborted = true;
    }
  }
}

if (aborted) process.exit(1);
