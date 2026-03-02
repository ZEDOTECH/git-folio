const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

export const logger = {
  step(msg: string): void {
    console.log(`${BOLD}${CYAN}→${RESET} ${msg}`);
  },
  progress(msg: string): void {
    console.log(`${DIM}  ${msg}${RESET}`);
  },
  warn(msg: string): void {
    console.warn(`${YELLOW}⚠ ${msg}${RESET}`);
  },
  success(msg: string): void {
    console.log(`${GREEN}✓ ${msg}${RESET}`);
  },
  error(msg: string): void {
    console.error(`${RED}✗ ${msg}${RESET}`);
  },
  info(msg: string): void {
    console.log(`${DIM}  ${msg}${RESET}`);
  },
};
