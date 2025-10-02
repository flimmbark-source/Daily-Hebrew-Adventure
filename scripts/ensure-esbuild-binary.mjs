import { access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const binaryName = process.platform === 'win32' ? 'esbuild.exe' : 'esbuild';
const projectRoot = process.cwd();
const binaryPath = path.join(projectRoot, 'node_modules', 'esbuild', 'bin', binaryName);
const installScriptPath = path.join(projectRoot, 'node_modules', 'esbuild', 'install.js');

async function ensureBinary() {
  try {
    await access(binaryPath, fsConstants.X_OK);
    return;
  } catch (binaryMissingError) {
    // Continue to attempt re-installation.
  }

  try {
    await access(installScriptPath, fsConstants.R_OK);
  } catch (missingInstallScriptError) {
    throw new Error('esbuild install script is missing. Please reinstall the `esbuild` package.');
  }

  const result = spawnSync(process.execPath, [installScriptPath], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`esbuild install script exited with code ${result.status}.`);
  }
}

await ensureBinary();
