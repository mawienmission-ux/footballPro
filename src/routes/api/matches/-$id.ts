import { createAPIFileRoute } from '@tanstack/react-start/api';
import { deleteLocalRow, listLocalRows, updateLocalRow } from '@/lib/local-store';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const APIRoute = createAPIFileRoute('/api/matches/$id')({
  GET: ({ params }) => {
    const row = listLocalRows('matches').find((item) => item.id === params.id);
    return row ? json(row) : json({ error: 'Match not found' }, 404);
  },
  PUT: async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const row = updateLocalRow('matches', params.id, body);
    return row ? json(row) : json({ error: 'Match not found' }, 404);
  },
  DELETE: ({ params }) => {
    deleteLocalRow('matches', params.id);
    return json({ deleted: true, id: params.id });
  },
});
