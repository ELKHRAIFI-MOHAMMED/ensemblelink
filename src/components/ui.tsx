"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";
import { couleurDe, initiales } from "@/lib/format";

/* ---------------------------------------------------------------- Logo */
export function Logo({ clair = false }: { clair?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="EnsembleLink, accueil">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-corail text-white shadow-carte transition group-hover:rotate-[-6deg]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.6-7.5 10-7.5 10Z" />
        </svg>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-creme bg-soleil" />
      </span>
      <span className={`font-display text-xl font-extrabold ${clair ? "text-white" : "text-ink"}`}>
        Ensemble<span className="text-corail">Link</span>
      </span>
      <span className="rounded-full bg-soleil px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">Bêta</span>
    </Link>
  );
}

/* ---------------------------------------------------------------- Avatar */
export function Avatar({ nom, src, taille = 40, carre = false }: { nom: string; src?: string | null; taille?: number; carre?: boolean }) {
  const forme = carre ? "rounded-xl" : "rounded-full";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={taille} height={taille} className={`${forme} shrink-0 object-cover`} style={{ width: taille, height: taille }} />;
  }
  return (
    <span
      aria-hidden
      className={`${forme} grid shrink-0 place-items-center font-display font-bold text-white`}
      style={{ width: taille, height: taille, background: couleurDe(nom), fontSize: taille * 0.38 }}
    >
      {initiales(nom)}
    </span>
  );
}

/* ---------------------------------------------------------------- Étoiles */
export function Etoiles({ note, taille = "text-base" }: { note: number | null | undefined; taille?: string }) {
  const n = Math.round(note ?? 0);
  return (
    <span className={`${taille} tracking-tight`} aria-label={note ? `${note.toFixed(1)} sur 5` : "Pas encore d'avis"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "text-soleil" : "text-ligne"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ChoixEtoiles({ valeur, onChange }: { valeur: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Note">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valeur === i}
          aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          className={`text-3xl transition hover:scale-110 ${i <= valeur ? "text-soleil" : "text-ligne"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- états */
export function Chargement({ texte = "Chargement…" }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-soft" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-corail border-t-transparent" />
      {texte}
    </div>
  );
}

export function Vide({ emoji = "🌱", titre, texte, action }: { emoji?: string; titre: string; texte?: string; action?: React.ReactNode }) {
  return (
    <div className="carte flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="font-display text-lg font-bold">{titre}</p>
      {texte && <p className="max-w-md text-sm text-ink-soft">{texte}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Alerte({ type = "erreur", children }: { type?: "erreur" | "succes" | "info"; children: React.ReactNode }) {
  const cls = {
    erreur: "border-[#f5c2c2] bg-[#fff1f1] text-[#a32626]",
    succes: "border-foret/20 bg-foret-soft text-foret",
    info: "border-soleil bg-soleil-soft text-[#7a5200]",
  }[type];
  return (
    <div role={type === "erreur" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

export function Stat({ valeur, libelle, accent = "text-ink" }: { valeur: React.ReactNode; libelle: string; accent?: string }) {
  return (
    <div className="carte p-5">
      <p className={`font-display text-3xl font-extrabold ${accent}`}>{valeur}</p>
      <p className="mt-1 text-sm text-ink-soft">{libelle}</p>
    </div>
  );
}

export function Barre({ valeur, max, couleur = "bg-corail" }: { valeur: number; max: number; couleur?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((valeur / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-sable" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${couleur} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------------------------------------------------------------- Modale */
export function Modale({ ouverte, onFermer, titre, children }: { ouverte: boolean; onFermer: () => void; titre: string; children: React.ReactNode }) {
  if (!ouverte) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center" onClick={onFermer}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="carte apparition max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-bold">{titre}</h2>
          <button onClick={onFermer} className="rounded-full p-1 text-ink-soft hover:bg-sable" aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Toasts */
type Toast = { id: number; texte: string; type: "succes" | "erreur" | "info" };
const ToastContext = createContext<(texte: string, type?: Toast["type"]) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notifier = useCallback((texte: string, type: Toast["type"] = "succes") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, texte, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={notifier}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[1100] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`apparition pointer-events-auto rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-carte-hover ${
              t.type === "erreur" ? "bg-[#b42318]" : t.type === "info" ? "bg-ink" : "bg-foret"
            }`}
          >
            {t.texte}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
