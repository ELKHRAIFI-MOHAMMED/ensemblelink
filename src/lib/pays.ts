/** Pays pris en charge (identique à backPfe/login_app/pays.py). Le premier fuseau est celui par défaut. */
export const PAYS: Record<string, { nom: string; drapeau: string; fuseaux: string[]; centre: [number, number]; zoom: number }> = {
  MA: { nom: "Maroc", drapeau: "🇲🇦", fuseaux: ["Africa/Casablanca"], centre: [31.8, -7.1], zoom: 5 },
  FR: { nom: "France", drapeau: "🇫🇷", fuseaux: ["Europe/Paris"], centre: [46.6, 2.4], zoom: 5 },
  GB: { nom: "Royaume-Uni", drapeau: "🇬🇧", fuseaux: ["Europe/London"], centre: [54.0, -2.5], zoom: 5 },
  US: { nom: "États-Unis", drapeau: "🇺🇸", fuseaux: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"], centre: [39.5, -98.3], zoom: 4 },
  CA: { nom: "Canada", drapeau: "🇨🇦", fuseaux: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Halifax"], centre: [56.0, -96.0], zoom: 3 },
  BE: { nom: "Belgique", drapeau: "🇧🇪", fuseaux: ["Europe/Brussels"], centre: [50.6, 4.5], zoom: 7 },
  CH: { nom: "Suisse", drapeau: "🇨🇭", fuseaux: ["Europe/Zurich"], centre: [46.8, 8.2], zoom: 7 },
  ES: { nom: "Espagne", drapeau: "🇪🇸", fuseaux: ["Europe/Madrid"], centre: [40.2, -3.7], zoom: 5 },
  DE: { nom: "Allemagne", drapeau: "🇩🇪", fuseaux: ["Europe/Berlin"], centre: [51.1, 10.4], zoom: 5 },
  IT: { nom: "Italie", drapeau: "🇮🇹", fuseaux: ["Europe/Rome"], centre: [42.8, 12.5], zoom: 5 },
  SN: { nom: "Sénégal", drapeau: "🇸🇳", fuseaux: ["Africa/Dakar"], centre: [14.5, -14.4], zoom: 6 },
  TN: { nom: "Tunisie", drapeau: "🇹🇳", fuseaux: ["Africa/Tunis"], centre: [34.0, 9.5], zoom: 6 },
  DZ: { nom: "Algérie", drapeau: "🇩🇿", fuseaux: ["Africa/Algiers"], centre: [28.0, 2.6], zoom: 5 },
};

/** Pays mis en avant dans les filtres. */
export const PAYS_PRINCIPAUX = ["MA", "FR", "GB", "US", "CA"];

export const drapeau = (code?: string | null) => (code && PAYS[code]?.drapeau) || "🌍";
export const nomPays = (code?: string | null) => (code && PAYS[code]?.nom) || code || "";

/** Libellé court d'un fuseau : « New York (UTC−5) ». */
export function libelleFuseau(tz: string) {
  const ville = tz.split("/").pop()!.replace(/_/g, " ");
  try {
    const decalage = new Intl.DateTimeFormat("fr-FR", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    return `${ville} (${decalage})`;
  } catch {
    return ville;
  }
}

/** Fuseau du navigateur, utilisé pour savoir s'il faut afficher l'heure locale de l'activité. */
export const fuseauNavigateur = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
