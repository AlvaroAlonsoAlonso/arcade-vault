"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

// Mock session persisted in localStorage, same keys as the prototype.
const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

export type SessionUser = { name: string };
export type SavedScore = { game: string; score: number; name: string; at: number };

type Session = {
  user: SessionUser | null;
  login: (user: SessionUser | null) => void;
  logout: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === USER_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readRawUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

function writeUser(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function parseUser(raw: string | null): SessionUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // Server snapshot is always "no session"; the client value is applied after hydration.
  const rawUser = useSyncExternalStore(subscribe, readRawUser, () => null);

  const session = useMemo<Session>(
    () => ({
      user: parseUser(rawUser),
      login: (user) => writeUser(user),
      logout: () => writeUser(null),
      saveScore: (entry) => {
        try {
          const all = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]") as SavedScore[];
          all.push({ ...entry, at: Date.now() });
          localStorage.setItem(SCORES_KEY, JSON.stringify(all));
        } catch {}
      },
    }),
    [rawUser],
  );

  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
