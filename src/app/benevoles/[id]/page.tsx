"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import ListeAvis from "@/components/ListeAvis";
import { Avatar, Chargement, Etoiles, Stat, Vide } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { nombre } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Avis, Citoyen, StatsCitoyen } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function BenevolePage() {
  const { id } = useParams<{ id: string }>();
  const { me, chargement: authCharge } = useAuth();
  const router = useRouter();
  const { data, chargement, erreur } = useApi<{ citoyen: Citoyen; stats: StatsCitoyen; avis: Avis[] }>(me ? `/citoyens/${id}/` : null, [me]);

  useEffect(() => {
    if (!authCharge && !me) router.replace(`/connexion?suivant=/benevoles/${id}`);
  }, [authCharge, me, router, id]);

  if (authCharge || chargement || !me) return <Chargement />;
  if (erreur || !data) return <div className="conteneur py-16"><Vide titre="Profil introuvable" /></div>;
  const { citoyen: c, stats, avis } = data;

  return (
    <div className="conteneur max-w-4xl py-10">
      <div className="carte flex flex-col items-center gap-5 p-8 text-center md:flex-row md:text-left">
        <Avatar nom={`${c.prenom} ${c.nom}`} src={c.photo} taille={96} />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">{c.prenom} {c.nom}</h1>
          <p className="text-sm text-ink-soft">📍 {c.ville || "—"}</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm md:justify-start"><Etoiles note={stats.note_moyenne} /> {stats.note_moyenne ?? "—"} · {stats.nombre_avis} avis</p>
        </div>
        {me.user.id !== c.user && <Link href={`/messages?avec=${c.user}`} className="btn-primary">💬 Écrire</Link>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat valeur={`${nombre(stats.heures_benevolat)} h`} libelle="de bénévolat" accent="text-corail" />
        <Stat valeur={stats.missions_realisees} libelle="missions réalisées" accent="text-foret" />
        <Stat valeur={stats.dons_effectues} libelle="dons effectués" />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section className="space-y-6">
          <div><h2 className="text-xl font-bold">À propos</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.bio || "—"}</p></div>
          {c.experiences && <div><h2 className="text-xl font-bold">Expériences</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.experiences}</p></div>}
          <div>
            <h2 className="text-xl font-bold">Compétences</h2>
            <div className="mt-2 flex flex-wrap gap-2">{c.competences_detail.map((x) => <span key={x.id} className="pastille border border-ligne bg-white">✦ {x.nom}</span>)}</div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Badges</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {stats.badges.filter((b) => b.obtenu).map((b) => <span key={b.code} title={b.description} className="pastille bg-soleil-soft text-ink">{b.emoji} {b.libelle}</span>)}
              {!stats.badges.some((b) => b.obtenu) && <span className="text-sm text-ink-soft">Aucun badge pour l&apos;instant.</span>}
            </div>
          </div>
        </section>
        <section><h2 className="mb-3 text-xl font-bold">Avis des associations</h2><ListeAvis avis={avis} /></section>
      </div>
    </div>
  );
}
