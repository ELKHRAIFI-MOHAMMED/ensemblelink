"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Alerte, Avatar, Barre, Chargement, Modale, Vide, useToast } from "@/components/ui";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateLongue, heure, STATUTS_CANDIDATURE, TYPES_ANNONCE } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { fuseauNavigateur, libelleFuseau, nomPays } from "@/lib/pays";
import type { Annonce, Candidature, Groupe } from "@/lib/types";
import Drapeau from "@/components/Drapeau";

const CarteMissions = dynamic(() => import("@/components/CarteMissions"), { ssr: false });

type Participant = Candidature["citoyen"];

export default function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { data: a, chargement, erreur, recharger } = useApi<Annonce>(`/annonces/${id}/`, [me?.user.id]);
  const estActivite = a?.type === "ACTIVITE";
  const peutVoirParticipants = Boolean(me && a && (estActivite || a.est_organisateur));
  const participants = useApi<Participant[]>(peutVoirParticipants ? `/annonces/${id}/participants/` : null, [a?.places_prises]);

  const [message, setMessage] = useState("");
  const [quantite, setQuantite] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreurForm, setErreurForm] = useState<string | null>(null);
  const [signaler, setSignaler] = useState(false);
  const [motif, setMotif] = useState("");

  if (chargement && !a) return <Chargement />;
  if (erreur || !a)
    return (
      <div className="conteneur py-16">
        <Vide emoji="🧭" titre="Annonce introuvable" action={<Link href="/missions" className="btn-primary">Voir les annonces</Link>} />
      </div>
    );

  const type = TYPES_ANNONCE[a.type];
  const cat = a.categorie_detail;
  const tz = a.fuseau_horaire;
  const autreFuseau = tz !== fuseauNavigateur();
  const objectif = a.objectif_don ? Number(a.objectif_don) : null;
  const orga = a.organisateur;
  const lienOrga = orga.type === "ASSOCIATION" ? `/associations/${orga.profil_id}` : `/benevoles/${orga.profil_id}`;
  const estCitoyen = me?.user.type === "CITOYEN";
  const fermee = !a.est_active || a.est_terminee || a.est_complete;

  const postuler = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreurForm(null);
    try {
      const c = await api<Candidature>("/candidatures/", {
        method: "POST",
        body: { annonce: a.id, message, ...(a.type === "DON" && quantite ? { quantite_don: quantite } : {}) },
      });
      toast(
        a.type === "DON"
          ? "Merci ! Votre promesse de don est enregistrée 💝"
          : c.statut === "ACCEPTEE"
            ? "C'est confirmé, vous participez 🎉"
            : "Demande envoyée à l'organisateur",
      );
      setMessage("");
      recharger();
    } catch (err) {
      setErreurForm((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  const creerGroupe = async () => {
    try {
      const g = await api<Groupe>(`/annonces/${a.id}/groupe/`, { method: "POST", body: {} });
      toast("Groupe créé : les participants acceptés y sont ajoutés automatiquement 💬");
      router.push(`/messages?groupe=${g.id}`);
    } catch (err) {
      toast((err as Error).message, "erreur");
    }
  };

  const envoyerSignalement = async () => {
    try {
      await api("/signalements/", { method: "POST", body: { annonce: a.id, motif } });
      toast("Signalement transmis à l'équipe de modération");
      setSignaler(false);
      setMotif("");
    } catch (err) {
      toast((err as Error).message, "erreur");
    }
  };

  const boutonInscription = a.type === "DON" ? "Confirmer mon don" : a.inscription_automatique ? "Je participe !" : estActivite ? "Demander à participer" : "Envoyer ma candidature";

  return (
    <div className="pb-10">
      {/* Bandeau */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${cat?.couleur ?? "#F26B3A"}1a, ${cat?.couleur ?? "#F26B3A"}40)` }}>
        <div className="conteneur relative py-12">
          <Link href="/missions" className="text-sm font-semibold text-ink-soft hover:text-ink">← Toutes les annonces</Link>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className={`pastille ${type.classe}`}>{type.emoji} {type.libelle}</span>
            {cat && <span className="pastille bg-white text-ink">{cat.icone} {cat.nom}</span>}
            <span className="pastille bg-white text-ink"><Drapeau code={a.pays} /> {nomPays(a.pays)}</span>
            {a.est_terminee && <span className="pastille bg-ink text-white">Terminée</span>}
            {!a.est_active && <span className="pastille bg-ink text-white">Clôturée</span>}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">{a.titre}</h1>
          <Link href={lienOrga} className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/80 py-1.5 pl-1.5 pr-4 hover:bg-white">
            <Avatar nom={orga.nom} src={orga.avatar} taille={32} />
            <span className="text-sm font-semibold">{orga.nom}</span>
            <span className="text-xs text-foret">{orga.type === "ASSOCIATION" ? (orga.verifie ? "✔ association vérifiée" : "association") : "organisé par un·e citoyen·ne"}</span>
          </Link>
          <span className="pointer-events-none absolute -bottom-6 right-6 hidden select-none text-[160px] leading-none md:block" aria-hidden>{cat?.icone ?? type.emoji}</span>
        </div>
      </section>

      <div className="conteneur mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Contenu */}
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <Info
              icone="🗓️"
              titre={dateLongue(a.date_debut, tz)}
              sous={`${heure(a.date_debut, tz)} – ${heure(a.date_fin, tz)}${a.duree_heures > 24 ? ` · jusqu'au ${dateLongue(a.date_fin, tz)}` : ""}`}
            />
            <Info icone={<Drapeau code={a.pays} libelle />} titre={a.ville || "Lieu"} sous={a.lieu} />
            <Info
              icone={a.type === "DON" ? "🎁" : "👥"}
              titre={a.type === "DON" ? `${a.quantite_collectee} ${a.unite_don}` : a.places_restantes === null ? "Ouvert à tous" : `${a.places_restantes} place${(a.places_restantes ?? 0) > 1 ? "s" : ""}`}
              sous={a.type === "DON" ? (objectif ? `sur ${objectif} ${a.unite_don}` : "collectés") : `${a.places_prises} participant${a.places_prises > 1 ? "s" : ""} inscrit${a.places_prises > 1 ? "s" : ""}`}
            />
          </div>
          {autreFuseau && (
            <p className="-mt-5 text-xs text-ink-soft">🕒 Horaires à l&apos;heure locale de l&apos;activité · {libelleFuseau(tz)}</p>
          )}

          {a.type === "DON" && objectif && (
            <div className="carte p-5">
              <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Objectif de collecte</span><span>{Math.round((a.quantite_collectee / objectif) * 100)} %</span></div>
              <Barre valeur={a.quantite_collectee} max={objectif} couleur="bg-soleil" />
            </div>
          )}

          <section>
            <h2 className="text-2xl font-bold">{estActivite ? "L'activité" : "La mission"}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{a.description}</p>
          </section>

          {a.competences_detail.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">Compétences appréciées</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.competences_detail.map((c) => (
                  <span key={c.id} className="pastille border border-ligne bg-white text-ink">✦ {c.nom}</span>
                ))}
              </div>
            </section>
          )}

          {peutVoirParticipants && (
            <section>
              <h2 className="text-xl font-bold">Participants ({participants.data?.length ?? 0})</h2>
              {participants.data?.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {participants.data.map((p) => (
                    <li key={p.id}>
                      <Link href={`/benevoles/${p.id}`} className="flex items-center gap-2 rounded-full border border-ligne bg-white py-1 pl-1 pr-3 text-sm hover:border-ink">
                        <Avatar nom={`${p.prenom} ${p.nom}`} src={p.photo} taille={26} />
                        {p.prenom} {p.nom[0]}. <Drapeau code={p.pays} libelle />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-soft">Soyez la première personne à rejoindre !</p>
              )}
            </section>
          )}

          {a.latitude && a.longitude && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Où ?</h2>
              <CarteMissions annonces={[a]} hauteur={280} />
            </section>
          )}
        </div>

        {/* Colonne d'action */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="carte p-6">
            {a.est_organisateur ? (
              <div className="space-y-3">
                <p className="font-display text-lg font-bold">Vous organisez cette {estActivite ? "activité" : "annonce"}</p>
                <Link href={`/espace/annonce?id=${a.id}`} className="btn-primary w-full">Modifier</Link>
                <Link href="/espace" className="btn-ghost w-full">Gérer les participants</Link>
              </div>
            ) : a.ma_candidature ? (
              <div className="space-y-3 text-center">
                <span className="text-4xl">{a.ma_candidature.statut === "ACCEPTEE" ? "🎉" : "⏳"}</span>
                <p className="font-display text-lg font-bold">{a.ma_candidature.statut === "ACCEPTEE" ? "Vous participez !" : "Vous avez déjà répondu"}</p>
                <span className={`pastille ${STATUTS_CANDIDATURE[a.ma_candidature.statut].classe}`}>{STATUTS_CANDIDATURE[a.ma_candidature.statut].libelle}</span>
                <Link href="/espace" className="btn-ghost w-full">Suivre dans mon espace</Link>
              </div>
            ) : fermee ? (
              <Alerte type="info">{a.est_terminee ? "Cette annonce est terminée." : a.est_complete ? "Toutes les places sont prises. Revenez bientôt !" : "Cette annonce est clôturée."}</Alerte>
            ) : !me ? (
              <div className="space-y-3 text-center">
                <p className="font-display text-xl font-bold">{a.type === "DON" ? "Envie de contribuer ?" : "Partant·e ?"}</p>
                <p className="text-sm text-ink-soft">Créez votre profil en une minute pour participer.</p>
                <Link href={`/inscription?suivant=/missions/${a.id}`} className="btn-primary w-full">Je m&apos;inscris</Link>
                <Link href={`/connexion?suivant=/missions/${a.id}`} className="btn-ghost w-full">J&apos;ai déjà un compte</Link>
              </div>
            ) : estCitoyen ? (
              <form onSubmit={postuler} className="space-y-4">
                <p className="font-display text-xl font-bold">{a.type === "DON" ? "Je fais un don" : estActivite ? "Je rejoins l'activité" : "Je postule"}</p>
                {a.inscription_automatique && <p className="text-xs text-foret">✓ Inscription immédiate, sans validation</p>}
                {a.type === "DON" && (
                  <div>
                    <label className="etiquette" htmlFor="qte">Quantité ({a.unite_don || "unités"})</label>
                    <input id="qte" type="number" min="1" step="1" required className="champ" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="etiquette" htmlFor="msg">Un mot pour l&apos;organisateur</label>
                  <textarea id="msg" rows={3} className="champ" placeholder="Vos disponibilités, votre motivation…" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                {erreurForm && <Alerte>{erreurForm}</Alerte>}
                <button className="btn-primary w-full" disabled={envoi}>{envoi ? "Envoi…" : boutonInscription}</button>
              </form>
            ) : (
              <Alerte type="info">Seuls les comptes citoyens peuvent participer.</Alerte>
            )}
          </div>

          {/* Groupe de discussion */}
          {a.groupe ? (
            a.groupe.suis_membre ? (
              <Link href={`/messages?groupe=${a.groupe.id}`} className="carte flex items-center gap-3 p-4 hover:border-ink">
                <span className="text-2xl">{a.groupe.est_ferme ? "🔒" : "💬"}</span>
                <span className="flex-1">
                  <span className="block font-bold">Groupe « {a.groupe.nom} »</span>
                  <span className="text-xs text-ink-soft">{a.groupe.est_ferme ? "Fermé — consultable en lecture seule" : "Discutez avec les participants"}</span>
                </span>
                <span className="text-corail">→</span>
              </Link>
            ) : (
              <p className="carte p-4 text-xs text-ink-soft">💬 Un groupe de discussion existe : vous le rejoindrez automatiquement une fois votre participation acceptée.</p>
            )
          ) : (
            a.est_organisateur && !a.est_terminee && (
              <button onClick={creerGroupe} className="carte flex w-full items-center gap-3 p-4 text-left hover:border-ink">
                <span className="text-2xl">💬</span>
                <span className="flex-1">
                  <span className="block font-bold">Créer le groupe de discussion</span>
                  <span className="text-xs text-ink-soft">Les participants acceptés le rejoignent automatiquement ; il se ferme à la fin.</span>
                </span>
              </button>
            )
          )}

          <div className="grid grid-cols-2 gap-2">
            <a href={`${API_URL}/api/annonces/${a.id}/ical/`} className="btn-ghost btn-sm">📅 Ajouter à l&apos;agenda</a>
            {me && !a.est_organisateur ? (
              <button onClick={() => router.push(`/messages?avec=${orga.user}`)} className="btn-ghost btn-sm">💬 Contacter</button>
            ) : (
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast("Lien copié"); }} className="btn-ghost btn-sm">🔗 Partager</button>
            )}
          </div>
          {me && !a.est_organisateur && (
            <button onClick={() => setSignaler(true)} className="w-full text-center text-xs text-ink-soft underline-offset-4 hover:underline">Signaler cette annonce</button>
          )}
        </aside>
      </div>

      <Modale ouverte={signaler} onFermer={() => setSignaler(false)} titre="Signaler cette annonce">
        <p className="mb-3 text-sm text-ink-soft">Contenu trompeur, lieu incorrect, comportement inapproprié… Expliquez-nous le problème.</p>
        <textarea rows={4} className="champ" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif du signalement" />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setSignaler(false)}>Annuler</button>
          <button className="btn-primary" disabled={motif.trim().length < 5} onClick={envoyerSignalement}>Envoyer</button>
        </div>
      </Modale>
    </div>
  );
}

function Info({ icone, titre, sous }: { icone: React.ReactNode; titre: string; sous: string }) {
  return (
    <div className="carte flex gap-3 p-4">
      <span className="text-2xl" aria-hidden>{icone}</span>
      <span className="min-w-0">
        <span className="block font-bold">{titre}</span>
        <span className="block truncate text-sm text-ink-soft">{sous}</span>
      </span>
    </div>
  );
}
