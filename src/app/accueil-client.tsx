"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MissionCard from "@/components/MissionCard";
import { Chargement, Vide } from "@/components/ui";
import { nombre } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { PAYS, PAYS_PRINCIPAUX } from "@/lib/pays";
import type { Annonce, Categorie, Paginated, StatsGlobales } from "@/lib/types";
import Drapeau from "@/components/Drapeau";

export function RechercheHero() {
  const router = useRouter();
  const [quoi, setQuoi] = useState("");
  const [ou, setOu] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (quoi) p.set("search", quoi);
        if (ou) p.set("ville", ou);
        router.push(`/missions?${p}`);
      }}
      className="mt-8 flex max-w-xl flex-col gap-2 rounded-3xl border border-ligne bg-white p-2 shadow-carte-hover sm:flex-row sm:rounded-full"
    >
      <label className="flex flex-1 items-center gap-2 px-4">
        <span aria-hidden>🔎</span>
        <span className="sr-only">Quoi</span>
        <input value={quoi} onChange={(e) => setQuoi(e.target.value)} placeholder="Une envie, un mot-clé…" className="w-full bg-transparent py-2.5 text-sm outline-none" />
      </label>
      <label className="flex flex-1 items-center gap-2 border-ligne px-4 sm:border-l">
        <span aria-hidden>📍</span>
        <span className="sr-only">Où</span>
        <input value={ou} onChange={(e) => setOu(e.target.value)} placeholder="Ville" className="w-full bg-transparent py-2.5 text-sm outline-none" />
      </label>
      <button className="btn-primary">Rechercher</button>
    </form>
  );
}

export function StatsLive() {
  const { data } = useApi<StatsGlobales>("/stats/");
  const items = [
    [data?.missions_actives, "annonces ouvertes"],
    [data?.activites, "activités entre citoyens"],
    [data?.benevoles, "citoyens inscrits"],
    [data?.pays, "pays"],
    [data ? `${nombre(data.heures_benevolat)} h` : undefined, "de bénévolat validées"],
  ] as const;
  return (
    <section className="conteneur relative">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl2 border border-ligne bg-ligne shadow-carte md:grid-cols-5">
        {items.map(([v, l]) => (
          <div key={l} className="bg-white px-6 py-6">
            <p className="font-display text-3xl font-extrabold text-ink md:text-4xl">
              {v ?? <span className="inline-block h-8 w-16 animate-pulse rounded bg-sable" />}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Categories() {
  const { data, chargement } = useApi<Categorie[]>("/categories/");
  if (chargement) return <Chargement />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {data?.map((c) => (
        <Link
          key={c.id}
          href={`/missions?categorie=${c.id}`}
          className="group flex items-center gap-3 rounded-2xl border border-ligne bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-carte-hover"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl transition group-hover:scale-110" style={{ background: `${c.couleur}1f` }}>
            {c.icone}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{c.nom}</span>
            <span className="text-xs text-ink-soft">{c.nombre_annonces ?? 0} mission{(c.nombre_annonces ?? 0) > 1 ? "s" : ""}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function MissionsUne({ filtre = "" }: { filtre?: string }) {
  const { data, chargement, erreur } = useApi<Paginated<Annonce>>(`/annonces/?a_venir=true&ordering=date_debut&page_size=6${filtre}`);
  if (chargement) return <Chargement />;
  if (erreur)
    return <Vide emoji="🔌" titre="L'API ne répond pas" texte="Vérifiez que le serveur Django tourne sur http://127.0.0.1:8000." />;
  if (!data?.results.length) return <Vide titre="Aucune mission à venir pour le moment" />;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.results.map((a) => (
        <MissionCard key={a.id} a={a} />
      ))}
    </div>
  );
}

export function BandeauPays() {
  return (
    <div className="flex flex-wrap gap-2">
      {PAYS_PRINCIPAUX.map((code) => (
        <Link
          key={code}
          href={`/missions?pays=${code}`}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <Drapeau code={code} className="text-xl" /> {PAYS[code].nom}
        </Link>
      ))}
      <span className="flex items-center rounded-full px-3 py-2 text-sm text-white/60">… et ailleurs 🌍</span>
    </div>
  );
}
