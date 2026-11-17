import type { AnnonceType, StatutCandidature, StatutVerification } from "./types";

const fmtDate = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const fmtHeure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const fmtLong = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export const dateCourte = (iso: string) => fmtDate.format(new Date(iso));
export const heure = (iso: string) => fmtHeure.format(new Date(iso));
export const dateLongue = (iso: string) => fmtLong.format(new Date(iso));

export function plage(debut: string, fin: string) {
  const d = new Date(debut);
  const f = new Date(fin);
  if (d.toDateString() === f.toDateString()) return `${dateCourte(debut)} · ${heure(debut)} – ${heure(fin)}`;
  return `du ${dateCourte(debut)} au ${dateCourte(fin)}`;
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

/** Convertit une date ISO en valeur pour <input type="datetime-local">. */
export function versInputDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
