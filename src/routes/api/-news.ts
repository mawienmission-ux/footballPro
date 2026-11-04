import { createAPIFileRoute } from '@tanstack/react-start/api';
import { createLocalRow, listLocalRows } from '@/lib/local-store';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const APIRoute = createAPIFileRoute('/api/news')({
  GET: () => json(listLocalRows('news')),
  POST: async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const record = createLocalRow('news', {
      ...body,
      id: body.id ?? `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      published_at: body.published_at ?? new Date().toISOString(),
    });

    return json(record, 201);
  },
});
