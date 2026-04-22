"use client";

import * as React from "react";

/**
 * Prototype auth — localStorage session. Swap for NextAuth/Clerk before
 * production. Shape kept compatible with a server-session upgrade path.
 */

export interface Session {
  userId: string;
  email: string;
  name: string;
  plan: "beta" | "operator" | "desk";
  createdAt: string;
}

const KEY = "wholesail:session:v1";
const USERS_KEY = "wholesail:users:v1";
const EVENT = "wholesail:session-changed";

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: Session["plan"];
  createdAt: string;
}

async function hash(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password + "::wholesail-beta-salt");
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (session) {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(KEY);
  }
  window.dispatchEvent(new Event(EVENT));
}

export async function signUp(args: {
  email: string;
  name: string;
  password: string;
  plan?: Session["plan"];
}): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const email = args.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (args.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!args.name.trim()) {
    return { ok: false, error: "Name is required." };
  }

  const users = readUsers();
  if (users.find((u) => u.email === email)) {
    return {
      ok: false,
      error: "An account with that email already exists. Sign in instead.",
    };
  }

  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    name: args.name.trim(),
    passwordHash: await hash(args.password),
    plan: args.plan ?? "beta",
    createdAt: new Date().toISOString(),
  };
  writeUsers([...users, user]);

  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    createdAt: new Date().toISOString(),
  };
  writeSession(session);
  return { ok: true, session };
}

export async function signIn(args: {
  email: string;
  password: string;
}): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const email = args.email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return { ok: false, error: "No account found for that email." };
  const h = await hash(args.password);
  if (h !== user.passwordHash) {
    return { ok: false, error: "Incorrect password." };
  }
  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    createdAt: new Date().toISOString(),
  };
  writeSession(session);
  return { ok: true, session };
}

export function signOut() {
  writeSession(null);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function snapshot(): string {
  if (typeof window === "undefined") return "null";
  return window.localStorage.getItem(KEY) ?? "null";
}

export function useSession(): Session | null {
  const raw = React.useSyncExternalStore(subscribe, snapshot, () => "null");
  return React.useMemo<Session | null>(() => {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);
}

export function readSessionSync(): Session | null {
  return readSession();
}
