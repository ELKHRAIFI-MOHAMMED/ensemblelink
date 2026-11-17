"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ListeAvis from "@/components/ListeAvis";
import MissionCard from "@/components/MissionCard";
import { Avatar, Chargement, Etoiles, Stat, Vide } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { dateLongue, nombre } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Annonce, Association, Avis, StatsAssociation } from "@/lib/types";

interface Fiche {
  association: Association;
  stats: StatsAssociation;
  annonces: Annonce[];
  avis: Avis[];
}

export default function AssociationPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAuth();
  const { data, chargement, erreur } = useApi<Fiche>(`/associations/${id}/`);

  if (chargement) return <Chargement />;
  if (erreur || !data) return <div className="conteneur py-16"><Vide emoji="🏚️" titre="Association introuvable" /></div>;

  const { association: a, stats, annonces, avis } = data;
  const aVenir = annonces.filter((x) => !x.est_terminee && x.est_active);
  const passees = annonces.filter((x) => x.est_terminee);
  const reseaux = Object.entries(a.reseaux_sociaux ?? {});

  return (
    <div className="conteneur py-10">
      <Link href="/associations" className="text-sm font-semibold text-ink-soft hover:text-ink">← Annuaire</Link>

      <section className="carte mt-5 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-corail-soft via-soleil-soft to-foret-soft" />
        <div className="flex flex-col gap-6 px-6 pb-6 md:flex-row md:items-end md:px-8">
          <div className="-mt-12 rounded-2xl border-4 border-white bg-white">
            <Avatar nom={a.nom} src={a.logo} taille={96} carre />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold">{a.nom}</h1>
              <span className="pastille bg-foret-soft text-foret">✔ Association vérifiée</span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">📍 {a.adresse || a.ville} · Membre depuis {dateLongue(a.date_creation)}</p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Etoiles note={stats.note_moyenne} /> <strong>{stats.note_moyenne ?? "—"}</strong>
              <span className="text-ink-soft">({stats.nombre_avis} avis)</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {me && me.user.id !== a.user && <Link href={`/messages?avec=${a.user}`} className="btn-primary">💬 Contacter</Link>}
            {a.site_web && <a href={a.site_web} target="_blank" rel="noopener noreferrer" className="btn-ghost">🌐 Site web</a>}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat valeur={stats.annonces_total} libelle="missions publiées" />
        <Stat valeur={stats.benevoles_mobilises} libelle="bénévoles mobilisés" accent="text-foret" />
        <Stat valeur={`${nombre(stats.heures_benevolat)} h`} libelle="de bénévolat" accent="text-corail" />
        <Stat valeur={stats.taux_presence !== null ? `${stats.taux_presence} %` : "—"} libelle="taux de présence" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold">Qui sommes-nous ?</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{a.description || "—"}</p>
          </section>
          <section>
            <h2 className="mb-4 text-2xl font-bold">Missions à venir ({aVenir.length})</h2>
            {aVenir.length ? (
              <div className="grid gap-5 sm:grid-cols-2">{aVenir.map((x) => <MissionCard key={x.id} a={x} />)}</div>
            ) : (
              <Vide titre="Aucune mission à venir" />
            )}
          </section>
          {passees.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">Missions passées</h2>
              <ul className="carte divide-y divide-ligne">
                {passees.map((x) => (
                  <li key={x.id}><Link href={`/missions/${x.id}`} className="flex justify-between gap-4 px-5 py-3 text-sm hover:bg-creme"><span className="font-semibold">{x.titre}</span><span className="text-ink-soft">{dateLongue(x.date_debut)}</span></Link></li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="space-y-6">
          <div className="carte p-5 text-sm">
            <h2 className="mb-3 font-display text-lg font-bold">Contact</h2>
            <dl className="space-y-2 text-ink-soft">
              {a.contact && <div><dt className="font-semibold text-ink">Email</dt><dd>{a.contact}</dd></div>}
              {a.telephone && <div><dt className="font-semibold text-ink">Téléphone</dt><dd>{a.telephone}</dd></div>}
              {reseaux.length > 0 && (
                <div><dt className="font-semibold text-ink">Réseaux</dt>
                  <dd className="flex flex-wrap gap-2">{reseaux.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="capitalize text-corail hover:underline">{k}</a>)}</dd>
                </div>
              )}
            </dl>
          </div>
          <div>
            <h2 className="mb-3 font-display text-lg font-bold">Avis des bénévoles</h2>
            <ListeAvis avis={avis} />
          </div>
        </aside>
      </div>
    </div>
  );
}
