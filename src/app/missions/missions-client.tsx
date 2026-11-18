"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MissionCard from "@/components/MissionCard";
import { Chargement, Vide, useToast } from "@/components/ui";
import { TYPES_ANNONCE } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { PAYS, PAYS_PRINCIPAUX } from "@/lib/pays";
import type { Annonce, AnnonceType, Categorie, Paginated } from "@/lib/types";
import Drapeau from "@/components/Drapeau";

const CarteMissions = dynamic(() => import("@/components/CarteMissions"), {
  ssr: false,
  loading: () => <div className="carte grid h-[520px] place-items-center text-ink-soft">Chargement de la carte…</div>,
});

export default function MissionsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [vue, setVue] = useState<"liste" | "carte">("liste");
  const [recherche, setRecherche] = useState(params.get("search") ?? "");
  const [ville, setVille] = useState(params.get("ville") ?? "");

  const { data: categories } = useApi<Categorie[]>("/categories/");

  // La requête API reprend les filtres de l'URL (lien partageable)
  const q = new URLSearchParams(params);
  if (!q.has("a_venir")) q.set("a_venir", "true");
  if (!q.has("ordering")) q.set("ordering", "date_debut");
  q.set("page_size", vue === "carte" ? "100" : "12");
  const { data, chargement, erreur } = useApi<Paginated<Annonce>>(`/annonces/?${q}`);

  const page = Number(params.get("page") ?? 1);

  const maj = (changes: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    if (!("page" in changes)) p.delete("page");
    router.replace(`${pathname}?${p}`, { scroll: false });
  };

  // Recherche texte avec un léger délai
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("search") ?? "") !== recherche || (params.get("ville") ?? "") !== ville) maj({ search: recherche, ville });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche, ville]);

  const presDeMoi = () => {
    if (!navigator.geolocation) return toast("Géolocalisation non disponible", "erreur");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        maj({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4), rayon_km: "25", ville: null });
        setVille("");
        toast("Missions dans un rayon de 25 km", "info");
      },
      () => toast("Autorisez la localisation pour utiliser cette option", "erreur"),
    );
  };

  const typeActif = params.get("type") as AnnonceType | null;
  const catActive = params.get("categorie");
  const paysActif = params.get("pays");
  const geoActif = params.has("rayon_km");
  const nbPages = data ? Math.ceil(data.count / 12) : 1;

  return (
    <div className="mt-8">
      {/* ----- barre de filtres */}
      <div className="carte flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-xl bg-creme px-3">
          <span aria-hidden>🔎</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Mot-clé, association…" aria-label="Recherche" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </label>
        <label className="flex items-center gap-2 rounded-xl bg-creme px-3 md:w-56">
          <span aria-hidden>📍</span>
          <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville" aria-label="Ville" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </label>
        <button onClick={geoActif ? () => maj({ lat: null, lng: null, rayon_km: null }) : presDeMoi} className={geoActif ? "btn-secondary" : "btn-ghost"}>
          {geoActif ? "✕ Près de moi" : "🧭 Près de moi"}
        </button>
        <div className="flex rounded-full bg-creme p-1" role="tablist" aria-label="Affichage">
          {(["liste", "carte"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={vue === v} onClick={() => setVue(v)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${vue === v ? "bg-white shadow-carte" : "text-ink-soft"}`}>
              {v === "liste" ? "☰ Liste" : "🗺️ Carte"}
            </button>
          ))}
        </div>
      </div>

      {/* ----- pays */}
      <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Pays">
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Pays</span>
        <Filtre actif={!paysActif} onClick={() => maj({ pays: null })}>🌍 Partout</Filtre>
        {PAYS_PRINCIPAUX.map((code) => (
          <Filtre key={code} actif={paysActif === code} onClick={() => maj({ pays: paysActif === code ? null : code, lat: null, lng: null, rayon_km: null })}>
            <span className="inline-flex items-center gap-1.5"><Drapeau code={code} /> {PAYS[code].nom}</span>
          </Filtre>
        ))}
      </div>

      {/* ----- pastilles type & catégorie */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Filtre actif={!typeActif} onClick={() => maj({ type: null })}>Tout</Filtre>
        {(Object.keys(TYPES_ANNONCE) as AnnonceType[]).map((t) => (
          <Filtre key={t} actif={typeActif === t} onClick={() => maj({ type: typeActif === t ? null : t })}>
            {TYPES_ANNONCE[t].emoji} {TYPES_ANNONCE[t].libelle}
          </Filtre>
        ))}
        <span className="mx-1 hidden w-px bg-ligne sm:block" />
        {categories?.map((c) => (
          <Filtre key={c.id} actif={catActive === String(c.id)} onClick={() => maj({ categorie: catActive === String(c.id) ? null : String(c.id) })}>
            {c.icone} {c.nom}
          </Filtre>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-soft">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="accent-corail" checked={params.get("places_disponibles") === "true"} onChange={(e) => maj({ places_disponibles: e.target.checked ? "true" : null })} />
          Places disponibles uniquement
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="accent-corail" checked={params.get("a_venir") === "false"} onChange={(e) => maj({ a_venir: e.target.checked ? "false" : null })} />
          Voir les missions passées
        </label>
        {data && <span className="ml-auto font-semibold text-ink">{data.count} mission{data.count > 1 ? "s" : ""}</span>}
      </div>

      {/* ----- résultats */}
      <div className="mt-6">
        {chargement && !data ? (
          <Chargement />
        ) : erreur ? (
          <Vide emoji="🔌" titre="Impossible de charger les missions" texte={erreur} />
        ) : !data?.results.length ? (
          <Vide emoji="🔍" titre="Aucune mission ne correspond" texte="Essayez d'élargir vos filtres ou une autre ville." action={<button className="btn-ghost" onClick={() => router.replace(pathname)}>Réinitialiser les filtres</button>} />
        ) : vue === "carte" ? (
          <CarteMissions annonces={data.results} />
        ) : (
          <>
            <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${chargement ? "opacity-60" : ""}`}>
              {data.results.map((a) => (
                <MissionCard key={a.id} a={a} />
              ))}
            </div>
            {nbPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => maj({ page: String(page - 1) })}>← Précédent</button>
                <span className="px-3 text-sm">Page {page} / {nbPages}</span>
                <button className="btn-ghost btn-sm" disabled={page >= nbPages} onClick={() => maj({ page: String(page + 1) })}>Suivant →</button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Filtre({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={actif} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${actif ? "border-ink bg-ink text-white" : "border-ligne bg-white text-ink-soft hover:border-ink"}`}>
      {children}
    </button>
  );
}
