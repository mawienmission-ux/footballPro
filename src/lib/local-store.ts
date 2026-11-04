export type LocalTableName = "clubs" | "matches" | "news" | "leagues" | "user_roles";

export type LocalRecord = Record<string, any>;

const STORAGE_KEY = "mission-football-local-store";

const seedLeagues = [
  { id: "league-sspl", name: "South Sudan Premier League", short_name: "SSPL", logo_url: "", sort_order: 1 },
  { id: "league-juba", name: "Juba Local Football Association (Konyokonyo League) First Division", short_name: "Juba", logo_url: "", sort_order: 2 },
  { id: "league-yei", name: "Yei Local Football Association", short_name: "Yei", logo_url: "", sort_order: 3 },
];

const seedClubs: Record<string, any>[] = [
  { id: "club-alhilal", name: "Al-Hilal FC", short_name: "ALH", league: "South Sudan Premier League", country: "South Sudan", sort_order: 1 },
  { id: "club-elite", name: "Elite FC", short_name: "ELI", league: "South Sudan Premier League", country: "South Sudan", sort_order: 2 },
  { id: "club-khartoum", name: "Khartoum FC", short_name: "KHA", league: "South Sudan Premier League", country: "South Sudan", sort_order: 3 },
  { id: "club-juba", name: "Juba City FC", short_name: "JBA", league: "South Sudan Premier League", country: "South Sudan", sort_order: 4 },
  { id: "club-yambio", name: "Yambio FC", short_name: "YAM", league: "South Sudan Premier League", country: "South Sudan", sort_order: 5 },
];

const seedMatches: Record<string, any>[] = [];

const seedNews = [
  { id: "news-1", title: "Welcome to M.MissionFootball", category: "Platform News", body: "Your home for South Sudan Premier League football, local associations, clubs, players, fixtures and results.", published_at: new Date().toISOString() },
  { id: "news-2", title: "League and club information", category: "League News", body: "Administrators can add verified club names, official logos, fixtures and results through the dashboard.", published_at: new Date(Date.now() - 3600000).toISOString() },
];

const initialState = {
  clubs: seedClubs,
  matches: seedMatches,
  news: seedNews,
  leagues: seedLeagues,
  user_roles: [],
};

function getGlobalState() {
  const globalScope = globalThis as typeof globalThis & {
    __missionFootballLocalStore?: Record<LocalTableName, LocalRecord[]>;
  };

  if (!globalScope.__missionFootballLocalStore) {
    globalScope.__missionFootballLocalStore = structuredClone(initialState);
  }

  return globalScope.__missionFootballLocalStore;
}

function readState(): Record<LocalTableName, LocalRecord[]> {
  const memoryState = getGlobalState();

  if (typeof localStorage === "undefined") return structuredClone(memoryState);

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      persistState(memoryState);
      return structuredClone(memoryState);
    }

    const parsed = JSON.parse(stored) as Partial<Record<LocalTableName, LocalRecord[]>>;
    const nextState = {
      clubs: parsed.clubs ?? memoryState.clubs,
      matches: parsed.matches ?? memoryState.matches,
      news: parsed.news ?? memoryState.news,
      leagues: parsed.leagues ?? memoryState.leagues,
      user_roles: parsed.user_roles ?? memoryState.user_roles,
    };

    getGlobalState().clubs = nextState.clubs;
    getGlobalState().matches = nextState.matches;
    getGlobalState().news = nextState.news;
    getGlobalState().leagues = nextState.leagues;
    getGlobalState().user_roles = nextState.user_roles;
    return structuredClone(nextState);
  } catch {
    persistState(memoryState);
    return structuredClone(memoryState);
  }
}

function persistState(state: Record<LocalTableName, LocalRecord[]>) {
  const globalScope = globalThis as typeof globalThis & {
    __missionFootballLocalStore?: Record<LocalTableName, LocalRecord[]>;
  };
  globalScope.__missionFootballLocalStore = structuredClone(state);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function ensureState() {
  const state = readState();
  persistState(state);
  return state;
}

export function listLocalRows(table: LocalTableName) {
  return structuredClone(readState()[table]);
}

export function upsertLocalRows(table: LocalTableName, rows: LocalRecord[]) {
  const state = readState();
  state[table] = rows;
  persistState(state);
  return rows;
}

export function createLocalRow(table: LocalTableName, row: LocalRecord) {
  const state = ensureState();
  const next = { ...row, id: row.id ?? generateId(table) };
  state[table] = [...state[table], next];
  persistState(state);
  return structuredClone(next);
}

export function updateLocalRow(table: LocalTableName, id: string, changes: LocalRecord) {
  const state = ensureState();
  const next = state[table].map((row) => (row.id === id ? { ...row, ...changes } : row));
  state[table] = next;
  persistState(state);
  return structuredClone(next.find((row) => row.id === id) ?? null);
}

export function deleteLocalRow(table: LocalTableName, id: string) {
  const state = ensureState();
  const next = state[table].filter((row) => row.id !== id);
  state[table] = next;
  persistState(state);
  return next;
}

export function clearLocalStore() {
  const state = { ...initialState };
  persistState(state);
}

function generateId(table: LocalTableName) {
  const prefix = table.slice(0, 3);
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hasLocalApiConfig() {
  return typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) !== null;
}

export function resetLocalStore() {
  const state = structuredClone(initialState);
  persistState(state);
  return state;
}
