import type { Command } from 'commander';
import { startServer } from '../../server/index.js';
import { exec } from 'node:child_process';
import { platform } from 'node:process';

export function registerServe(program: Command): void {
  program
    .command('serve')
    .description('Start the local Web UI for git-folio')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('--open', 'Open browser automatically after starting', false)
    .action((opts: { port: string; open: boolean }) => {
      const port = parseInt(opts.port, 10);
      startServer(port);

      if (opts.open) {
        // Small delay to let server start
        setTimeout(() => {
          const url = `http://localhost:${port}`;
          const cmd =
            platform === 'win32' ? `start ${url}` :
            platform === 'darwin' ? `open ${url}` :
            `xdg-open ${url}`;
          exec(cmd);
        }, 500);
      }
    });
}
