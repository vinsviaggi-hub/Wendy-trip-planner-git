"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addChatMessage, loadChat, type ChatMessage } from "@/lib/chatStorage";
import { uid } from "@/lib/storage";
import { Button } from "@/components/ui/Button";

function fmtTime(ts: number) {
  try {
    return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(ts);
  } catch {
    return "";
  }
}

export function TripChat({ tripId }: { tripId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // loadChat (nella versione che ti ho dato) torna già ordinata per createdAt asc
    setMessages(loadChat(tripId));
  }, [tripId]);

  // autoscroll quando arrivano nuovi messaggi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const canSend = useMemo(() => text.trim().length >= 1, [text]);

  function send() {
    const t = text.trim();
    if (!t) return;

    const msg: ChatMessage = {
      id: uid("msg"),
      tripId,
      text: t,
      author: "Tu",
      createdAt: Date.now(),
    };

    addChatMessage(tripId, msg);

    // ✅ chat naturale: aggiungi in fondo
    setMessages((prev) => [...prev, msg]);
    setText("");
  }

  return (
    <div className="rounded-3xl border border-black/25 bg-white/45 backdrop-blur p-6 shadow-card ring-1 ring-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-ink">Chat del viaggio</div>
          <div className="text-xs text-muted mt-1">
            Appunti, decisioni e messaggi del gruppo nello stesso posto dell’itinerario.
          </div>
        </div>
      </div>

      {/* input */}
      <div className="mt-4 flex gap-2">
        <input
          className="w-full rounded-xl border border-black/25 bg-white/50 backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/35"
          placeholder="Scrivi un messaggio..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter invia, Shift+Enter va a capo (se vuoi multi-line dimmelo)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send} disabled={!canSend}>
          Invia
        </Button>
      </div>

      {/* messages */}
      <div className="mt-4 rounded-2xl border border-black/25 bg-white/35 backdrop-blur p-3 ring-1 ring-black/10">
        <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-black/25 bg-white/35 backdrop-blur p-4 text-sm text-muted">
              Nessun messaggio ancora.
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-black/25 bg-white/40 backdrop-blur p-3 shadow-sm ring-1 ring-black/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted">{m.author ?? "Tu"}</div>
                  <div className="text-[11px] text-muted">{fmtTime(m.createdAt)}</div>
                </div>
                <div className="mt-1 text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">
                  {m.text}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="mt-3 text-xs text-muted">
        Tip: scrivi qui decisioni tipo “orario volo”, “hotel”, “cosa prenotare” — poi restano attaccate al viaggio.
      </div>
    </div>
  );
}