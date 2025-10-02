#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

import './ensure-esbuild-binary.mjs';

const [, , command, ...args] = process.argv;

if (!command) {
  console.error('Usage: node run-with-esbuild-binary.mjs <command> [..args]');
  process.exit(1);
}

const binaryName = process.platform === 'win32' ? 'esbuild.exe' : 'esbuild';
const binaryPath = path.join(process.cwd(), 'node_modules', 'esbuild', 'bin', binaryName);

const child = spawn(command, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ESBUILD_BINARY_PATH: binaryPath,
  },
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
