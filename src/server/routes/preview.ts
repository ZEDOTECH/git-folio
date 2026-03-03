import { Hono } from 'hono';
import { startPreview, stopPreview, getPreviewStatus } from '../astro-preview.js';

export const previewRouter = new Hono();

previewRouter.post('/preview/start', async (c) => {
  const body = (await c.req.json<{ outputDir?: string }>().catch(() => ({}))) as { outputDir?: string };
  const outputDir = body.outputDir || './output';
  const result = await startPreview(outputDir);
  if (!result.ok) {
    return c.json(result, 400);
  }
  return c.json(result);
});

previewRouter.post('/preview/stop', (c) => {
  const result = stopPreview();
  return c.json(result);
});

previewRouter.get('/preview/status', (c) => {
  return c.json(getPreviewStatus());
});
