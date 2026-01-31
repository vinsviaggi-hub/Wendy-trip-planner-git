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

function isMine(m: ChatMessage) {
  // In futuro lo leghi a auth (userId/email). Per ora: "Tu"
  return (m.author ?? "Tu") === "Tu";
}

export function TripChat({ tripId }: { tripId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(loadChat(tripId));
  }, [tripId]);

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
    setMessages((prev) => [...prev, msg]);
    setText("");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 shadow-[0_22px_60px_rgba(0,0,0,0.30)] ring-1 ring-white/10">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500/80 to-cyan-500/80 ring-1 ring-white/10 grid place-items-center">
              💬
            </div>
            <div>
              <div className="text-base font-semibold text-slate-50">Chat del viaggio</div>
              <div className="text-xs text-slate-200/70 mt-0.5">
                Appunti, decisioni e messaggi del gruppo nello stesso posto dell’itinerario.
              </div>
            </div>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-200/70">
          locale
        </span>
      </div>

      {/* input */}
      <div className="mt-5 flex gap-2">
        <input
          className={[
            "w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none",
            "text-slate-100 placeholder:text-slate-200/50",
            "focus:ring-2 focus:ring-indigo-500/25 focus:border-white/15",
          ].join(" ")}
          placeholder="Scrivi un messaggio…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
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
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur p-3 ring-1 ring-white/10">
        <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200/70">
              Nessun messaggio ancora. Scrivi la prima nota del viaggio.
            </div>
          ) : (
            messages.map((m) => {
              const mine = isMine(m);
              return (
                <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={[
                      "max-w-[92%] sm:max-w-[78%] rounded-2xl border p-3 shadow-sm",
                      mine
                        ? "border-white/10 bg-gradient-to-r from-indigo-500/18 to-cyan-500/14"
                        : "border-white/10 bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-200/70">
                        {mine ? "Tu" : m.author ?? "Ospite"}
                      </div>
                      <div className="text-[11px] text-slate-200/60">{fmtTime(m.createdAt)}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-50/95 leading-relaxed whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-200/70">
        Tip: segna qui cose tipo “orario volo”, “hotel”, “cosa prenotare” — così restano attaccate al viaggio.
      </div>
    </div>
  );
}