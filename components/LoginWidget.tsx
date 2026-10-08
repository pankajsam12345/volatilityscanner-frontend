"use client";

import { useState } from "react";
import { useAuth } from "./AuthContext";

export function LoginWidget() {
  const { username, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [u, setU] = useState("admin");
  const [p, setP] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  if (username) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500">Signed in as</span>
        <span className="mono text-zinc-200">{username}</span>
        <button onClick={logout} className="rounded border border-zinc-700 px-2 py-0.5 text-zinc-400 hover:bg-zinc-800">
          Logout
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(u, p);
      setOpen(false);
      setP("");
    } catch {
      setError("Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">
        Login
      </button>
      {open && (
        <form onSubmit={submit} className="absolute right-0 top-8 z-20 flex w-56 flex-col gap-2 rounded border border-zinc-700 bg-panel-2 p-3 shadow-xl">
          <input className="input" placeholder="username" value={u} onChange={(e) => setU(e.target.value)} autoFocus />
          <input className="input" placeholder="password" type="password" value={p} onChange={(e) => setP(e.target.value)} />
          {error && <span className="text-[11px] text-red-400">{error}</span>}
          <button type="submit" disabled={busy} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <span className="text-[10px] text-zinc-600">Demo credentials: admin / admin</span>
        </form>
      )}
    </div>
  );
}
