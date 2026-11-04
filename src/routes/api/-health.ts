import { createAPIFileRoute } from '@tanstack/react-start/api';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const APIRoute = createAPIFileRoute('/api/health')({
  GET: () => json({ ok: true, service: 'mission-football', timestamp: new Date().toISOString() }),
});
