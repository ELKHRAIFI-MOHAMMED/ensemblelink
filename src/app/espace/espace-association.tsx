"use client";

import Link from "next/link";
import { useState } from "react";
import { Alerte, Avatar, Chargement, ChoixEtoiles, Modale, Stat, Vide, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { profilAssociation, statsAssociation, useAuth } from "@/lib/auth";
import { nombre, plage, STATUTS_CANDIDATURE, STATUTS_VERIF, TYPES_ANNONCE } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Annonce, Candidature, Paginated } from "@/lib/types";
import { AvisEnAttente, Onglets } from "./commun";

type Onglet = "candidatures" | "annonces" | "pointage";

export default function EspaceAssociation() {
  const { me, recharger: rechargerMe } = useAuth();
  const profil = profilAssociation(me)!;
  const stats = statsAssociation(me)!;
  const toast = useToast();
  const [onglet, setOnglet] = useState<Onglet>("candidatures");
  const [filtreStatut, setFiltreStatut] = useState<string>("EN_ATTENTE");
  const [suivi, setSuivi] = useState<Candidature | null>(null);

  const annonces = useApi<Paginated<Annonce>>("/annonces/mes/?page_size=100&ordering=-date_debut");
  const cands = useApi<Paginated<Candidature>>(`/candidatures/mes/?page_size=100${filtreStatut ? `&statut=${filtreStatut}` : ""}`);

  const verifiee = profil.statut_verification === "VERIFIEE";
  const v = STATUTS_VERIF[profil.statut_verification];

  const maj = async (c: Candidature, body: Record<string, unknown>, ok: string) => {
    try {
      await api(`/candidatures/mes/${c.id}/`, { method: "PATCH", body });
      toast(ok);
      cands.recharger();
      annonces.recharger();
      rechargerMe();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  const basculerAnnonce = async (a: Annonce) => {
    try {
      await api(`/annonces/${a.id}/`, { method: "PATCH", body: { est_active: !a.est_active } });
      toast(a.est_active ? "Annonce clôturée" : "Annonce réouverte");
      annonces.recharger();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  const creerGroupe = async (a: Annonce) => {
    try {
      await api(`/annonces/${a.id}/groupe/`, { method: "POST", body: {} });
      toast("Groupe créé : les bénévoles acceptés y sont ajoutés automatiquement 💬");
      annonces.recharger();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  const supprimer = async (a: Annonce) => {
    if (!confirm(`Supprimer définitivement « ${a.titre} » ?`)) return;
    try {
      await api(`/annonces/${a.id}/`, { method: "DELETE" });
      toast("Annonce supprimée");
      annonces.recharger();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <Avatar nom={profil.nom} src={profil.logo} taille={72} carre />
        <div className="flex-1">
          <span className={`pastille ${v.classe}`}>{v.libelle}</span>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{profil.nom}</h1>
        </div>
        <div className="flex gap-2">
          {verifiee && <Link href={`/associations/${profil.id}`} className="btn-ghost">Page publique</Link>}
          {verifiee ? (
            <Link href="/espace/annonce" className="btn-primary">+ Publier une annonce</Link>
          ) : (
            <button className="btn-primary" disabled title="Disponible après vérification">+ Publier une annonce</button>
          )}
        </div>
      </div>

      {profil.statut_verification === "EN_ATTENTE" && (
        <Alerte type="info">⏳ Votre association est en cours de vérification. Vous pourrez publier dès validation par un administrateur — vous serez notifié·e.</Alerte>
      )}
      {profil.statut_verification === "REJETEE" && (
        <Alerte>La vérification a été refusée : {profil.motif_rejet}. <Link href="/espace/profil" className="font-semibold underline">Mettre à jour mon profil</Link></Alerte>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat valeur={stats.annonces_actives} libelle={`annonces actives / ${stats.annonces_total}`} />
        <Stat valeur={stats.candidatures_en_attente} libelle="candidatures à traiter" accent="text-corail" />
        <Stat valeur={stats.benevoles_mobilises} libelle="bénévoles mobilisés" accent="text-foret" />
        <Stat valeur={`${nombre(stats.heures_benevolat)} h`} libelle={`de bénévolat · présence ${stats.taux_presence ?? "—"} %`} />
      </div>

      <AvisEnAttente onFait={rechargerMe} />

      <Onglets
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "candidatures", libelle: "Candidatures", nb: stats.candidatures_en_attente },
          { id: "annonces", libelle: "Mes annonces" },
          { id: "pointage", libelle: "📱 Pointage" },
        ]}
      />

      {onglet === "candidatures" && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[["EN_ATTENTE", "À traiter"], ["ACCEPTEE", "Acceptées"], ["REFUSEE", "Refusées"], ["", "Toutes"]].map(([s, l]) => (
              <button key={s} onClick={() => setFiltreStatut(s)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${filtreStatut === s ? "border-ink bg-ink text-white" : "border-ligne bg-white text-ink-soft"}`}>{l}</button>
            ))}
          </div>
          {cands.chargement && !cands.data ? (
            <Chargement />
          ) : !cands.data?.results.length ? (
            <Vide emoji="📭" titre="Aucune candidature dans cette catégorie" />
          ) : (
            <ul className="space-y-3">
              {cands.data.results.map((c) => {
                const st = STATUTS_CANDIDATURE[c.statut];
                const nom = `${c.citoyen.prenom} ${c.citoyen.nom}`;
                return (
                  <li key={c.id} className="carte flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                    <Link href={`/benevoles/${c.citoyen.id}`} className="flex items-center gap-3 lg:w-56">
                      <Avatar nom={nom} src={c.citoyen.photo} taille={44} />
                      <span>
                        <span className="block font-bold hover:text-corail">{nom}</span>
                        <span className="text-xs text-ink-soft">📍 {c.citoyen.ville || "—"}</span>
                      </span>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{c.annonce_detail.titre}</p>
                      <p className="text-xs text-ink-soft">{plage(c.annonce_detail.date_debut, c.annonce_detail.date_fin, c.annonce_detail.fuseau_horaire)}{c.quantite_don && ` · 🎁 ${Number(c.quantite_don)} ${c.annonce_detail.unite_don}`}</p>
                      {c.message && <p className="mt-1 line-clamp-2 text-sm italic text-ink-soft">« {c.message} »</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`pastille ${st.classe}`}>{st.libelle}</span>
                      {c.presence_confirmee && <span className="pastille bg-foret text-white">✓ {Number(c.heures_effectuees)} h</span>}
                      {c.statut === "EN_ATTENTE" && (
                        <>
                          <button className="btn-secondary btn-sm" onClick={() => maj(c, { statut: "ACCEPTEE" }, `${c.citoyen.prenom} est accepté·e 🎉`)}>Accepter</button>
                          <button className="btn-ghost btn-sm" onClick={() => maj(c, { statut: "REFUSEE" }, "Candidature refusée")}>Refuser</button>
                        </>
                      )}
                      {c.statut === "ACCEPTEE" && <button className="btn-ghost btn-sm" onClick={() => setSuivi(c)}>Suivi</button>}
                      <Link href={`/messages?avec=${c.citoyen.user}`} className="btn-ghost btn-sm" aria-label="Écrire">💬</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {onglet === "annonces" && (
        <section>
          {annonces.chargement && !annonces.data ? (
            <Chargement />
          ) : !annonces.data?.results.length ? (
            <Vide emoji="📣" titre="Aucune annonce publiée" texte={verifiee ? "Publiez votre première mission pour recevoir des candidatures." : "Disponible après vérification."} />
          ) : (
            <div className="carte overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-ligne text-left text-xs uppercase tracking-wider text-ink-soft">
                  <tr><th className="px-5 py-3">Annonce</th><th>Date</th><th>Inscrits</th><th>Statut</th><th className="px-5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-ligne">
                  {annonces.data.results.map((a) => (
                    <tr key={a.id} className="hover:bg-creme/60">
                      <td className="px-5 py-3">
                        <Link href={`/missions/${a.id}`} className="font-semibold hover:text-corail">{a.titre}</Link>
                        <span className={`pastille ml-2 ${TYPES_ANNONCE[a.type].classe}`}>{TYPES_ANNONCE[a.type].libelle}</span>
                      </td>
                      <td className="text-ink-soft">{plage(a.date_debut, a.date_fin, a.fuseau_horaire)}</td>
                      <td>{a.type === "DON" ? `${a.quantite_collectee} / ${a.objectif_don ? Number(a.objectif_don) : "∞"} ${a.unite_don}` : `${a.places_prises} / ${a.nombre_places ?? "∞"}`}</td>
                      <td>{a.est_terminee ? <span className="pastille bg-sable text-ink-soft">Terminée</span> : a.est_active ? <span className="pastille bg-foret-soft text-foret">En ligne</span> : <span className="pastille bg-ink text-white">Clôturée</span>}</td>
                      <td className="space-x-1 whitespace-nowrap px-5 text-right">
                        {a.groupe ? (
                          <Link href={`/messages?groupe=${a.groupe.id}`} className="btn-ghost btn-sm" title="Groupe de discussion">{a.groupe.est_ferme ? "🔒" : "💬"}</Link>
                        ) : (
                          !a.est_terminee && a.type !== "DON" && (
                            <button className="btn-ghost btn-sm" title="Créer le groupe des bénévoles" onClick={() => creerGroupe(a)}>+ 💬</button>
                          )
                        )}
                        <Link href={`/espace/annonce?id=${a.id}`} className="btn-ghost btn-sm">Modifier</Link>
                        {!a.est_terminee && <button className="btn-ghost btn-sm" onClick={() => basculerAnnonce(a)}>{a.est_active ? "Clôturer" : "Rouvrir"}</button>}
                        <button className="btn-ghost btn-sm text-[#a32626]" onClick={() => supprimer(a)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {onglet === "pointage" && <Pointage onOk={() => { cands.recharger(); rechargerMe(); }} />}

      <ModaleSuivi c={suivi} onFermer={() => setSuivi(null)} onSave={(body) => suivi && maj(suivi, body, "Suivi enregistré").then(() => setSuivi(null))} />
    </div>
  );
}

function Pointage({ onOk }: { onOk: () => void }) {
  const [code, setCode] = useState("");
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);
  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api<{ detail: string }>("/candidatures/pointage/", { method: "POST", body: { code: code.trim() } });
      setResultat({ ok: true, texte: r.detail });
      setCode("");
      onOk();
    } catch (err) {
      setResultat({ ok: false, texte: (err as Error).message });
    }
  };
  return (
    <section className="carte grid gap-6 p-6 md:grid-cols-2">
      <div>
        <h2 className="text-xl font-bold">Confirmer la présence d&apos;un bénévole</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Le jour de la mission, chaque bénévole accepté présente un QR code depuis son espace. Scannez-le avec l&apos;appareil photo de
          votre téléphone puis collez le code ici, ou saisissez-le directement. Ses heures sont validées automatiquement.
        </p>
      </div>
      <form onSubmit={valider} className="space-y-3">
        <label className="etiquette" htmlFor="code">Code de présence</label>
        <input id="code" className="champ font-mono" placeholder="ex. 3f2b8c1e-…" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button className="btn-secondary w-full">Valider la présence</button>
        {resultat && <Alerte type={resultat.ok ? "succes" : "erreur"}>{resultat.texte}</Alerte>}
      </form>
    </section>
  );
}

function ModaleSuivi({ c, onFermer, onSave }: { c: Candidature | null; onFermer: () => void; onSave: (b: Record<string, unknown>) => void }) {
  const [presence, setPresence] = useState(false);
  const [heures, setHeures] = useState("");
  const [note, setNote] = useState(0);
  const [cle, setCle] = useState<number | null>(null);
  // Réinitialise le formulaire à l'ouverture d'une autre candidature
  if (c && c.id !== cle) {
    setCle(c.id);
    setPresence(c.presence_confirmee);
    setHeures(String(Number(c.heures_effectuees) || ""));
    setNote(c.note_engagement ?? 0);
  }
  if (!c) return null;
  return (
    <Modale ouverte onFermer={onFermer} titre={`Suivi de ${c.citoyen.prenom} ${c.citoyen.nom}`}>
      <p className="mb-4 text-sm text-ink-soft">{c.annonce_detail.titre}</p>
      <div className="space-y-4">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-foret" checked={presence} onChange={(e) => setPresence(e.target.checked)} /> Présence confirmée
        </label>
        <div>
          <label className="etiquette" htmlFor="h">Heures effectuées</label>
          <input id="h" type="number" step="0.5" min="0" className="champ" value={heures} onChange={(e) => setHeures(e.target.value)} placeholder="Par défaut : durée de la mission" />
        </div>
        <div>
          <p className="etiquette">Engagement</p>
          <ChoixEtoiles valeur={note} onChange={setNote} />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onFermer}>Annuler</button>
        <button className="btn-primary" onClick={() => onSave({ presence_confirmee: presence, ...(heures ? { heures_effectuees: heures } : {}), ...(note ? { note_engagement: note } : {}) })}>Enregistrer</button>
      </div>
    </Modale>
  );
}
