export type ChatMessage = {
  id: string;
  tripId: string;
  text: string;
  author?: string; // default: "Tu"
  createdAt: number;
};

// ✅ nuovo namespace
const key = (tripId: string) => `wendy:chat:${tripId}`;

// ✅ vecchio namespace (migrazione)
const legacyKey = (tripId: string) => `wendenzo:chat:${tripId}`;

function normalizeMessages(tripId: string, raw: any): ChatMessage[] {
  if (!Array.isArray(raw)) return [];

  const cleaned: ChatMessage[] = raw
    .map((m: any) => {
      const text = typeof m?.text === "string" ? m.text.trim() : "";
      if (!text) return null;

      const createdAt =
        typeof m?.createdAt === "number" && Number.isFinite(m.createdAt) ? m.createdAt : Date.now();

      const id =
        typeof m?.id === "string" && m.id.trim().length > 0
          ? m.id
          : `${createdAt}-${Math.random().toString(16).slice(2)}`;

      const author =
        typeof m?.author === "string" && m.author.trim().length > 0 ? m.author.trim() : "Tu";

      return {
        id,
        tripId,
        text,
        author,
        createdAt,
      } as ChatMessage;
    })
    .filter(Boolean) as ChatMessage[];

  // ✅ ordine chat naturale: vecchi → nuovi
  cleaned.sort((a, b) => a.createdAt - b.createdAt);

  // ✅ limita a 200 (tieni gli ultimi)
  return cleaned.slice(-200);
}

export function loadChat(tripId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];

  // 1) prova key nuova
  try {
    const raw = localStorage.getItem(key(tripId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = normalizeMessages(tripId, parsed);

      // se normalizzazione ha sistemato roba strana, risalva
      localStorage.setItem(key(tripId), JSON.stringify(normalized));
      return normalized;
    }
  } catch {
    // continua sotto
  }

  // 2) fallback: prova key vecchia e migra
  try {
    const legacyRaw = localStorage.getItem(legacyKey(tripId));
    if (!legacyRaw) return [];

    const legacyParsed = JSON.parse(legacyRaw);
    const normalized = normalizeMessages(tripId, legacyParsed);

    // migra -> salva nella nuova key e lascia la vecchia (non rischiamo perdite)
    localStorage.setItem(key(tripId), JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
}

export function addChatMessage(tripId: string, msg: ChatMessage) {
  if (typeof window === "undefined") return;

  const existing = loadChat(tripId);

  const safeText = typeof msg?.text === "string" ? msg.text.trim() : "";
  if (!safeText) return;

  const createdAt =
    typeof msg?.createdAt === "number" && Number.isFinite(msg.createdAt) ? msg.createdAt : Date.now();

  const author =
    typeof msg?.author === "string" && msg.author.trim().length > 0 ? msg.author.trim() : "Tu";

  const id =
    typeof msg?.id === "string" && msg.id.trim().length > 0
      ? msg.id
      : `${createdAt}-${Math.random().toString(16).slice(2)}`;

  const next = normalizeMessages(tripId, [
    ...existing,
    {
      id,
      tripId,
      text: safeText,
      author,
      createdAt,
    } as ChatMessage,
  ]);

  localStorage.setItem(key(tripId), JSON.stringify(next));
}