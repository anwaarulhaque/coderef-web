"use client";

import { useEffect, useState } from "react";
import { api, requireAccount, useAccount, type SavedItem } from "@/lib/account/client";

// One request per page load for the whole list, shared by every button on the page.
let favorites: Promise<SavedItem[]> | null = null;
const loadFavorites = () => (favorites ??= api<{ items: SavedItem[] }>("GET", "/items?kind=favorite").then((r) => r.items).catch(() => []));

/** ♡ toggle that keeps a design in the account's favourites (free, unlimited). */
export function FavoriteButton({ id, name }: { id: string; name: string }) {
  const { me } = useAccount();
  const signedIn = !!me?.user;
  const [itemId, setItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Signed-in visitors wait for their saved list, so a click can't add a duplicate before we know the state.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const ready = !signedIn || loadedFor === id;

  useEffect(() => {
    if (!signedIn) {
      favorites = null;
      return;
    }
    let live = true;
    void loadFavorites().then((list) => {
      if (!live) return;
      setItemId(list.find((f) => f.title === id)?.id ?? null);
      setLoadedFor(id);
    });
    return () => {
      live = false;
    };
  }, [signedIn, id]);

  const toggle = async () => {
    setBusy(true);
    try {
      if (!(await requireAccount("Sign in to keep favourite designs on all your devices."))) return;
      if (itemId) {
        await api("DELETE", `/items/${itemId}`);
        setItemId(null);
      } else {
        const r = await api<{ item: SavedItem }>("POST", "/items", { kind: "favorite", title: id, data: { id, name } });
        setItemId(r.item.id);
      }
      favorites = null;
    } finally {
      setBusy(false);
    }
  };

  const on = !!itemId;
  const loading = busy || !ready;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-busy={loading}
      aria-pressed={on}
      title={on ? "Remove from favourites" : "Add to favourites"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-70 ${on ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface hover:border-accent hover:text-accent"}`}
    >
      {loading ? (
        <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-spin">
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      ) : (
        <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M12 20.5s-7.5-4.4-9.3-9.3C1.4 7.6 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.9 3.1 4.6 6.7-1.8 4.9-9.3 9.3-9.3 9.3z" />
        </svg>
      )}
      {busy ? (on ? "Removing…" : "Saving…") : on ? "Favourited" : "Favourite"}
    </button>
  );
}
