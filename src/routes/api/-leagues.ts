import { createAPIFileRoute } from '@tanstack/react-start/api';
import { createLocalRow, listLocalRows } from '@/lib/local-store';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const APIRoute = createAPIFileRoute('/api/leagues')({
  GET: () => json(listLocalRows('leagues')),
  POST: async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const record = createLocalRow('leagues', {
      ...body,
      id: body.id ?? `league-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });

    return json(record, 201);
  },
});
