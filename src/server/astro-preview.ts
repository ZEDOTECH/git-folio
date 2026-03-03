import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export const ASTRO_PORT = 4321;

let astroProcess: ChildProcess | null = null;

export type PreviewStatus =
  | { ok: true; status: 'starting' }
  | { ok: true; status: 'already_running' }
  | { ok: true; status: 'stopped' }
  | { ok: false; message: string };

export async function startPreview(outputDir: string): Promise<PreviewStatus> {
  if (astroProcess) {
    return { ok: true, status: 'already_running' };
  }

  const absOutput = path.resolve(process.cwd(), outputDir);

  try {
    await fs.access(absOutput);
  } catch {
    return { ok: false, message: 'Output directory not found. Run generate first.' };
  }

  // Check if node_modules exists; if not, run npm install first
  const nodeModules = path.join(absOutput, 'node_modules');
  const hasNodeModules = await fs.access(nodeModules).then(() => true).catch(() => false);

  if (!hasNodeModules) {
    await runNpmInstall(absOutput);
  }

  astroProcess = spawn('npm', ['run', 'dev', '--', '--port', String(ASTRO_PORT)], {
    cwd: absOutput,
    stdio: 'pipe',
    shell: true,
  });

  astroProcess.on('exit', () => {
    astroProcess = null;
  });

  return { ok: true, status: 'starting' };
}

export function stopPreview(): PreviewStatus {
  if (!astroProcess) {
    return { ok: true, status: 'stopped' };
  }
  astroProcess.kill('SIGTERM');
  astroProcess = null;
  return { ok: true, status: 'stopped' };
}

export function getPreviewStatus(): { running: boolean; port: number } {
  return { running: astroProcess !== null, port: ASTRO_PORT };
}

function runNpmInstall(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['install'], { cwd, stdio: 'pipe', shell: true });
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install failed with code ${code}`));
    });
    proc.on('error', reject);
  });
}
