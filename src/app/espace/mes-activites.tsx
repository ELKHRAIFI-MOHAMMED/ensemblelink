"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Chargement, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { plage, STATUTS_CANDIDATURE } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Annonce, Candidature, Groupe, Paginated } from "@/lib/types";
import Drapeau from "@/components/Drapeau";

/** Activités organisées par le citoyen connecté : inscriptions à valider, groupe de discussion, gestion. */
export default function MesActivites({ onChange }: { onChange?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const annonces = useApi<Paginated<Annonce>>("/annonces/mes/?page_size=50&ordering=-date_debut");
  const recues = useApi<Paginated<Candidature>>("/candidatures/mes/?role=organisateur&page_size=200");

  const recharger = () => {
    annonces.recharger();
    recues.recharger();
    onChange?.();
  };

  const decider = async (c: Candidature, statut: "ACCEPTEE" | "REFUSEE") => {
    try {
      await api(`/candidatures/mes/${c.id}/`, { method: "PATCH", body: { statut } });
      toast(statut === "ACCEPTEE" ? `${c.citoyen.prenom} rejoint l'activité 🎉` : "Demande refusée");
      recharger();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  const creerGroupe = async (a: Annonce) => {
    try {
      const g = await api<Groupe>(`/annonces/${a.id}/groupe/`, { method: "POST", body: {} });
      toast("Groupe créé 💬");
      router.push(`/messages?groupe=${g.id}`);
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  const liste = annonces.data?.results ?? [];

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Mes activités organisées</h2>
          <p className="text-sm text-ink-soft">Match de foot, club de lecture, pique-nique… proposez ce que vous voulez !</p>
        </div>
        <Link href="/espace/annonce" className="btn-primary">+ Proposer une activité</Link>
      </div>

      {annonces.chargement && !annonces.data ? (
        <Chargement />
      ) : liste.length === 0 ? (
        <div className="carte flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
          <span className="text-4xl">⚽📖🧺</span>
          <p className="font-display text-lg font-bold">Vous n&apos;organisez encore rien</p>
          <p className="max-w-md text-sm text-ink-soft">
            Lancez une activité en 1 minute : les participants s&apos;inscrivent, un groupe de discussion les réunit et se ferme
            tout seul à la fin.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {liste.map((a) => {
            const demandes = (recues.data?.results ?? []).filter((c) => c.annonce === a.id && c.statut === "EN_ATTENTE");
            return (
              <li key={a.id} className="carte p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.est_terminee ? (
                        <span className="pastille bg-sable text-ink-soft">Terminée</span>
                      ) : a.est_active ? (
                        <span className="pastille bg-foret-soft text-foret">En ligne</span>
                      ) : (
                        <span className="pastille bg-ink text-white">Clôturée</span>
                      )}
                      <span className="pastille bg-white text-ink ring-1 ring-ligne">
                        👥 {a.places_prises}
                        {a.nombre_places ? ` / ${a.nombre_places}` : ""} inscrit·es
                      </span>
                      {a.inscription_automatique ? (
                        <span className="pastille bg-white text-foret ring-1 ring-ligne">✓ inscription libre</span>
                      ) : (
                        <span className="pastille bg-white text-ink-soft ring-1 ring-ligne">sur validation</span>
                      )}
                    </div>
                    <Link href={`/missions/${a.id}`} className="mt-2 block font-display text-lg font-bold hover:text-corail">
                      {a.titre}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      <Drapeau code={a.pays} /> {a.ville} · {plage(a.date_debut, a.date_fin, a.fuseau_horaire)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.groupe ? (
                      <Link href={`/messages?groupe=${a.groupe.id}`} className="btn-secondary btn-sm">
                        {a.groupe.est_ferme ? "🔒 Groupe (fermé)" : "💬 Ouvrir le groupe"}
                      </Link>
                    ) : (
                      !a.est_terminee && <button className="btn-secondary btn-sm" onClick={() => creerGroupe(a)}>💬 Créer le groupe</button>
                    )}
                    {!a.est_terminee && <Link href={`/espace/annonce?id=${a.id}`} className="btn-ghost btn-sm">Modifier</Link>}
                  </div>
                </div>

                {demandes.length > 0 && (
                  <div className="mt-4 space-y-2 rounded-2xl bg-soleil-soft/60 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8a5a00]">{demandes.length} demande(s) à valider</p>
                    {demandes.map((c) => (
                      <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-3 py-2">
                        <Link href={`/benevoles/${c.citoyen.id}`} className="flex items-center gap-2 text-sm font-semibold hover:text-corail">
                          <Avatar nom={`${c.citoyen.prenom} ${c.citoyen.nom}`} src={c.citoyen.photo} taille={28} />
                          {c.citoyen.prenom} {c.citoyen.nom} <Drapeau code={c.citoyen.pays} libelle />
                        </Link>
                        {c.message && <span className="flex-1 truncate text-xs italic text-ink-soft">« {c.message} »</span>}
                        <span className={`pastille ${STATUTS_CANDIDATURE[c.statut].classe}`}>{STATUTS_CANDIDATURE[c.statut].libelle}</span>
                        <button className="btn-secondary btn-sm" onClick={() => decider(c, "ACCEPTEE")}>Accepter</button>
                        <button className="btn-ghost btn-sm" onClick={() => decider(c, "REFUSEE")}>Refuser</button>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
