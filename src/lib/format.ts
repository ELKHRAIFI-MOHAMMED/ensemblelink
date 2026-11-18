import type { AnnonceType, StatutCandidature, StatutVerification } from "./types";

/* Les dates d'une activité s'affichent dans SON fuseau horaire (un match à New York est à 18h à New York,
   quel que soit le pays de la personne qui consulte). `tz` absent = fuseau du navigateur. */
const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions, tz?: string) {
  const cle = JSON.stringify(opts) + (tz ?? "");
  let f = cache.get(cle);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat("fr-FR", { ...opts, ...(tz ? { timeZone: tz } : {}) });
    } catch {
      f = new Intl.DateTimeFormat("fr-FR", opts);
    }
    cache.set(cle, f);
  }
  return f;
}

export const dateCourte = (iso: string, tz?: string) => fmt({ weekday: "short", day: "numeric", month: "short" }, tz).format(new Date(iso));
export const heure = (iso: string, tz?: string) => fmt({ hour: "2-digit", minute: "2-digit" }, tz).format(new Date(iso));
export const dateLongue = (iso: string, tz?: string) => fmt({ day: "numeric", month: "long", year: "numeric" }, tz).format(new Date(iso));
const jour = (iso: string, tz?: string) => fmt({ year: "numeric", month: "2-digit", day: "2-digit" }, tz).format(new Date(iso));

export function plage(debut: string, fin: string, tz?: string) {
  if (jour(debut, tz) === jour(fin, tz)) return `${dateCourte(debut, tz)} · ${heure(debut, tz)} – ${heure(fin, tz)}`;
  return `du ${dateCourte(debut, tz)} au ${dateCourte(fin, tz)}`;
}

export function ilya(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (Math.abs(s) < 60) return "à l'instant";
  if (Math.abs(s) < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (Math.abs(s) < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

export const nombre = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n);

export const TYPES_ANNONCE: Record<AnnonceType, { libelle: string; classe: string; emoji: string }> = {
  APPEL_BENEVOLAT: { libelle: "Bénévolat", classe: "bg-foret-soft text-foret", emoji: "🙋" },
  EVENEMENT: { libelle: "Évènement", classe: "bg-lilas text-[#5b3fc4]", emoji: "📅" },
  DON: { libelle: "Collecte de dons", classe: "bg-soleil-soft text-[#8a5a00]", emoji: "🎁" },
  ACTIVITE: { libelle: "Activité", classe: "bg-[#ffe1d6] text-corail-dark", emoji: "🎉" },
};

export const STATUTS_CANDIDATURE: Record<StatutCandidature, { libelle: string; classe: string }> = {
  EN_ATTENTE: { libelle: "En attente", classe: "bg-soleil-soft text-[#8a5a00]" },
  ACCEPTEE: { libelle: "Acceptée", classe: "bg-foret-soft text-foret" },
  REFUSEE: { libelle: "Non retenue", classe: "bg-[#fde2e2] text-[#a32626]" },
  ANNULEE: { libelle: "Annulée", classe: "bg-sable text-ink-soft" },
};

export const STATUTS_VERIF: Record<StatutVerification, { libelle: string; classe: string }> = {
  EN_ATTENTE: { libelle: "En attente de vérification", classe: "bg-soleil-soft text-[#8a5a00]" },
  VERIFIEE: { libelle: "Vérifiée", classe: "bg-foret-soft text-foret" },
  REJETEE: { libelle: "Rejetée", classe: "bg-[#fde2e2] text-[#a32626]" },
};

export function initiales(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join("");
}

/** Couleur stable dérivée d'un texte (avatars sans image). */
export function couleurDe(texte: string) {
  const palette = ["#F26B3A", "#1F5A43", "#3D6FD8", "#C2477A", "#8A5CF6", "#0E9AA7", "#B5651D"];
  let h = 0;
  for (const c of texte) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

/** Convertit une date ISO en valeur pour <input type="datetime-local">, exprimée dans le fuseau `tz`. */
export function versInputDate(iso: string, tz?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    ...(tz ? { timeZone: tz } : {}),
  }).formatToParts(new Date(iso));
  const v = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}`;
}
