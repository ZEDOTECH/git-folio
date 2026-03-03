import { Hono } from 'hono';
import fs from 'node:fs/promises';
import path from 'node:path';

export const envRouter = new Hono();

const envPath = () => path.join(process.cwd(), '.env');

const TOKEN_KEYS = ['PAT', 'KEY', 'TOKEN', 'SECRET'];
const isTokenKey = (key: string) => TOKEN_KEYS.some(t => key.toUpperCase().includes(t));
const MASK_CHAR = '●';

function maskValue(key: string, value: string): string {
  if (!isTokenKey(key) || !value) return value;
  if (value.length <= 8) return MASK_CHAR.repeat(value.length);
  return value.slice(0, 4) + MASK_CHAR.repeat(8) + value.slice(-4);
}

function isMasked(value: string): boolean {
  return value.includes(MASK_CHAR);
}

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

function serializeEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

envRouter.get('/env', async (c) => {
  try {
    const content = await fs.readFile(envPath(), 'utf-8');
    const env = parseEnv(content);
    const masked: Record<string, string | boolean> = { masked: true };
    for (const [k, v] of Object.entries(env)) {
      masked[k] = maskValue(k, v);
    }
    return c.json(masked);
  } catch {
    return c.json({});
  }
});

envRouter.put('/env', async (c) => {
  const updates = await c.req.json<Record<string, string>>();

  // Read existing .env (or start fresh)
  let existing: Record<string, string> = {};
  try {
    const content = await fs.readFile(envPath(), 'utf-8');
    existing = parseEnv(content);
  } catch {
    // .env doesn't exist yet — will be created
  }

  for (const [key, value] of Object.entries(updates)) {
    // Skip masked values — don't overwrite real tokens with masked placeholders
    if (isMasked(value)) continue;
    if (value === '') {
      delete existing[key];
    } else {
      existing[key] = value;
    }
  }

  await fs.writeFile(envPath(), serializeEnv(existing), 'utf-8');
  return c.json({ ok: true });
});
