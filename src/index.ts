#!/usr/bin/env node
import { Command } from 'commander';
import { registerGenerate } from './cli/commands/generate.js';
import { registerClearCache } from './cli/commands/clear-cache.js';

const program = new Command();

program
  .name('git-folio')
  .description('Generate an AI-powered portfolio site from your GitHub repos')
  .version('0.1.0');

registerGenerate(program);
registerClearCache(program);

program.parse(process.argv);
