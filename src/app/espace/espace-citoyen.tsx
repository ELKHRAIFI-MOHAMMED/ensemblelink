"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import MissionCard from "@/components/MissionCard";
import { Alerte, Avatar, Chargement, Modale, Stat, Vide, useToast } from "@/components/ui";
import { api, telecharger } from "@/lib/api";
import { profilCitoyen, statsCitoyen, useAuth } from "@/lib/auth";
import { nombre, plage, STATUTS_CANDIDATURE, TYPES_ANNONCE } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Annonce, Candidature, Paginated } from "@/lib/types";
import { AvisEnAttente, Onglets } from "./commun";
import MesActivites from "./mes-activites";
import Drapeau from "@/components/Drapeau";

type Onglet = "a_venir" | "attente" | "passees";

export default function EspaceCitoyen() {
  const { me, recharger: rechargerMe } = useAuth();
  const profil = profilCitoyen(me)!;
  const stats = statsCitoyen(me)!;
  const toast = useToast();
  const [onglet, setOnglet] = useState<Onglet>("a_venir");
  const [qr, setQr] = useState<Candidature | null>(null);

  const { data, chargement, recharger } = useApi<Paginated<Candidature>>("/candidatures/mes/?page_size=100");
  const { data: recos } = useApi<Annonce[]>("/annonces/recommandees/");

  const [maintenant] = useState(() => Date.now());
  const toutes = data?.results ?? [];
  const listes: Record<Onglet, Candidature[]> = {
    a_venir: toutes.filter((c) => c.statut === "ACCEPTEE" && new Date(c.annonce_detail.date_fin).getTime() >= maintenant),
    attente: toutes.filter((c) => c.statut === "EN_ATTENTE"),
    passees: toutes.filter(
      (c) => new Date(c.annonce_detail.date_fin).getTime() < maintenant || c.statut === "REFUSEE" || c.statut === "ANNULEE",
    ),
  };

  const action = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast(ok);
      recharger();
      rechargerMe();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  const badgesObtenus = stats.badges.filter((b) => b.obtenu);

  return (
    <div className="space-y-10">
      {/* En-tête */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <Avatar nom={`${profil.prenom} ${profil.nom}`} src={profil.photo} taille={72} />
        <div className="flex-1">
          <p className="text-sm text-ink-soft">Bonjour 👋</p>
          <h1 className="text-3xl font-extrabold md:text-4xl">{profil.prenom}, merci pour votre engagement !</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/benevoles/${profil.id}`} className="btn-ghost">Mon profil public</Link>
          <Link href="/missions" className="btn-primary">Trouver une activité</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat valeur={`${nombre(stats.heures_benevolat)} h`} libelle="de bénévolat validées" accent="text-corail" />
        <Stat valeur={stats.missions_realisees} libelle="missions réalisées" accent="text-foret" />
        <Stat valeur={stats.dons_effectues} libelle="dons effectués" />
        <Stat valeur={stats.note_moyenne ? `${stats.note_moyenne} ★` : "—"} libelle={`note moyenne (${stats.nombre_avis} avis)`} />
      </div>

      <AvisEnAttente onFait={rechargerMe} />

      {/* Badges */}
      <section className="carte p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Mes badges</h2>
          <p className="text-sm text-ink-soft">{badgesObtenus.length} / {stats.badges.length} débloqués</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {stats.badges.map((b) => (
            <div key={b.code} title={b.description} className={`flex flex-col items-center rounded-2xl border p-3 text-center ${b.obtenu ? "border-soleil bg-soleil-soft" : "border-ligne bg-creme opacity-50 grayscale"}`}>
              <span className="text-3xl">{b.emoji}</span>
              <span className="mt-1 text-xs font-bold">{b.libelle}</span>
              <span className="text-[11px] text-ink-soft">{b.description}</span>
            </div>
          ))}
        </div>
      </section>

      <MesActivites onChange={rechargerMe} />

      {/* Candidatures */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Mes engagements</h2>
          <Onglets
            actif={onglet}
            onChange={setOnglet}
            onglets={[
              { id: "a_venir", libelle: "À venir", nb: listes.a_venir.length },
              { id: "attente", libelle: "En attente", nb: listes.attente.length },
              { id: "passees", libelle: "Historique" },
            ]}
          />
        </div>
        {chargement ? (
          <Chargement />
        ) : !listes[onglet].length ? (
          <Vide emoji={onglet === "passees" ? "📜" : "🌱"} titre="Rien ici pour le moment" action={<Link href="/missions" className="btn-primary">Découvrir les missions</Link>} />
        ) : (
          <ul className="space-y-3">
            {listes[onglet].map((c) => {
              const passee = new Date(c.annonce_detail.date_fin).getTime() < maintenant;
              const st = STATUTS_CANDIDATURE[c.statut];
              return (
                <li key={c.id} className="carte flex flex-col gap-4 p-5 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`pastille ${st.classe}`}>{st.libelle}</span>
                      <span className={`pastille ${TYPES_ANNONCE[c.annonce_detail.type].classe}`}>{TYPES_ANNONCE[c.annonce_detail.type].libelle}</span>
                      {c.presence_confirmee && <span className="pastille bg-foret text-white">✓ Présence validée · {Number(c.heures_effectuees)} h</span>}
                    </div>
                    <Link href={`/missions/${c.annonce}`} className="mt-2 block font-display text-lg font-bold hover:text-corail">{c.annonce_detail.titre}</Link>
                    <p className="text-sm text-ink-soft">
                      {c.annonce_detail.organisateur.nom} · <Drapeau code={c.annonce_detail.pays} /> {c.annonce_detail.ville || c.annonce_detail.lieu} ·{" "}
                      {plage(c.annonce_detail.date_debut, c.annonce_detail.date_fin, c.annonce_detail.fuseau_horaire)}
                      {c.quantite_don && ` · 🎁 ${Number(c.quantite_don)} ${c.annonce_detail.unite_don}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.statut === "ACCEPTEE" && !passee && c.code_presence && (
                      <button className="btn-secondary btn-sm" onClick={() => setQr(c)}>📱 Mon QR de présence</button>
                    )}
                    {c.peut_attestation && (
                      <button className="btn-primary btn-sm" onClick={() => telecharger(`/candidatures/${c.id}/attestation/`, `attestation-${c.id}.pdf`).catch((e) => toast(e.message, "erreur"))}>
                        📄 Attestation
                      </button>
                    )}
                    <Link href={`/messages?avec=${c.annonce_detail.organisateur.user}`} className="btn-ghost btn-sm" aria-label="Écrire à l'organisateur">💬</Link>
                    {c.statut === "EN_ATTENTE" && (
                      <button className="btn-ghost btn-sm" onClick={() => action(() => api(`/candidatures/mes/${c.id}/`, { method: "DELETE" }), "Candidature retirée")}>Retirer</button>
                    )}
                    {c.statut === "ACCEPTEE" && !passee && (
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => confirm("Se désister ? L'organisateur sera prévenu.") && action(() => api(`/candidatures/${c.id}/annuler/`, { method: "POST" }), "Désistement enregistré")}
                      >
                        Me désister
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Recommandations */}
      {recos && recos.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Recommandé pour vous</h2>
          <p className="mb-5 text-sm text-ink-soft">D&apos;après vos compétences, vos causes favorites et votre ville.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recos.map((a) => <MissionCard key={a.id} a={a} />)}</div>
        </section>
      )}

      <Modale ouverte={Boolean(qr)} onFermer={() => setQr(null)} titre="Mon QR de présence">
        {qr?.code_presence && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-ink-soft">Présentez ce code à l&apos;organisateur le jour de « {qr.annonce_detail.titre} ».</p>
            <div className="rounded-2xl border border-ligne bg-white p-4">
              <QRCodeSVG value={qr.code_presence} size={220} fgColor="#1d2a23" />
            </div>
            <code className="break-all rounded-lg bg-sable px-3 py-1.5 text-xs">{qr.code_presence}</code>
            <Alerte type="info">Une fois scanné, vos heures sont validées et votre attestation devient disponible.</Alerte>
          </div>
        )}
      </Modale>
    </div>
  );
}
