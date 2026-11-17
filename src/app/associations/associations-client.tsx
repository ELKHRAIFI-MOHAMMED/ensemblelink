"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, Chargement, Etoiles, Vide } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import type { Association, Paginated } from "@/lib/types";

export default function AssociationsClient() {
  const [recherche, setRecherche] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(recherche), 300);
    return () => clearTimeout(t);
  }, [recherche]);

  const { data, chargement } = useApi<Paginated<Association>>(`/association/?page_size=50&search=${encodeURIComponent(q)}`);

  return (
    <div className="mt-8">
      <label className="carte flex max-w-md items-center gap-2 px-4">
        <span aria-hidden>🔎</span>
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom, ville, cause…" aria-label="Rechercher une association" className="w-full bg-transparent py-3 text-sm outline-none" />
      </label>

      <div className="mt-8">
        {chargement && !data ? (
          <Chargement />
        ) : !data?.results.length ? (
          <Vide titre="Aucune association trouvée" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((a) => (
              <Link key={a.id} href={`/associations/${a.id}`} className="carte group flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-carte-hover">
                <div className="flex items-center gap-4">
                  <Avatar nom={a.nom} src={a.logo} taille={56} carre />
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-bold group-hover:text-corail">{a.nom}</h2>
                    <p className="text-sm text-ink-soft">📍 {a.ville || "France"}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">{a.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ligne pt-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Etoiles note={a.note_moyenne} taille="text-sm" />
                    <span className="text-ink-soft">{a.note_moyenne ? a.note_moyenne.toFixed(1) : "—"} ({a.nombre_avis ?? 0})</span>
                  </span>
                  <span className="font-semibold text-foret">{a.nombre_annonces} mission{(a.nombre_annonces ?? 0) > 1 ? "s" : ""}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
