"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "Registrazione ok. Se richiesto, conferma via email.");
  }

  async function signIn() {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMsg(error.message);
    else window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white/70 backdrop-blur p-6 shadow-soft">
        <div className="text-xl font-semibold text-ink">Wendenzo</div>
        <div className="text-sm text-muted mt-1">Accedi per salvare i viaggi</div>

        <div className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-accent to-fuchsia-500 text-white px-4 py-3 text-sm hover:opacity-95"
          >
            Login
          </button>

          <button
            onClick={signUp}
            disabled={loading}
            className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-sm hover:bg-white"
          >
            Registrati
          </button>

          {msg && <div className="text-xs text-muted mt-2">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
