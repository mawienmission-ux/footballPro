import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  createLocalRow,
  deleteLocalRow,
  listLocalRows,
  updateLocalRow,
  type LocalTableName,
} from "./lib/local-store";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

async function getJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function getCollection(table: LocalTableName, request: Request) {
  if (request.method === "GET") return json(listLocalRows(table));
  if (request.method === "POST") {
    const payload = await getJsonBody(request);
    const row = createLocalRow(table, {
      ...(payload ?? {}),
      id: (payload as any)?.id ?? `${table.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: (payload as any)?.created_at ?? new Date().toISOString(),
    });
    return json(row, 201);
  }
  return json({ error: "Method not allowed" }, 405);
}

async function getItem(table: LocalTableName, request: Request, id: string) {
  if (request.method === "GET") {
    const row = listLocalRows(table).find((item) => item.id === id);
    return row ? json(row) : json({ error: `${table.slice(0, -1)} not found` }, 404);
  }
  if (request.method === "PUT") {
    const payload = await getJsonBody(request);
    const row = updateLocalRow(table, id, payload as Record<string, unknown>);
    return row ? json(row) : json({ error: `${table.slice(0, -1)} not found` }, 404);
  }
  if (request.method === "DELETE") {
    deleteLocalRow(table, id);
    return json({ deleted: true, id });
  }
  return json({ error: "Method not allowed" }, 405);
}

async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/api/health") {
    return json({ ok: true, service: "mission-football", timestamp: new Date().toISOString() });
  }

  const collectionMatches = [
    ["/api/clubs", "clubs"],
    ["/api/matches", "matches"],
    ["/api/news", "news"],
    ["/api/leagues", "leagues"],
  ] as const;

  for (const [route, table] of collectionMatches) {
    if (pathname === route) {
      return getCollection(table, request);
    }
    const itemMatch = new RegExp(`^${route.replace(/\//g, "\\/")}/([^/]+)$`);
    if (itemMatch.test(pathname)) {
      const id = pathname.slice(route.length + 1);
      return getItem(table, request, id);
    }
  }

  return undefined;
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const apiResponse = await handleApiRequest(request);
      if (apiResponse) {
        return apiResponse;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
