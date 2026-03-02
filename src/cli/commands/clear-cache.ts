import type { Command } from 'commander';
import { CacheManager } from '../../cache/index.js';
import { logger } from '../../utils/logger.js';

export function registerClearCache(program: Command): void {
  program
    .command('clear-cache')
    .description('Remove the local GitHub data cache (.git-folio-cache/)')
    .action(async () => {
      const cache = new CacheManager('.git-folio-cache');
      const exists = await cache.exists();
      if (!exists) {
        logger.info('No cache found.');
        return;
      }
      await cache.clear();
      logger.success('Cache cleared.');
    });
}
