"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Chargement, Modale, Vide, useToast } from "@/components/ui";
import { api, TEMPS_REEL, wsUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateLongue, heure, ilya, plage, TYPES_ANNONCE } from "@/lib/format";
import type { Conversation, Groupe, MembreGroupe, Message, MessageGroupe, UserMini } from "@/lib/types";
import Drapeau from "@/components/Drapeau";

/** Remplace la liste seulement si elle a changé (évite de faire défiler le fil à chaque rafraîchissement). */
function fusion(avant: Bulle[] | null, apres: Bulle[]) {
  if (avant && avant.length === apres.length && avant.at(-1)?.id === apres.at(-1)?.id) return avant;
  return apres;
}

const INTERVALLE_FIL = 4_000;

interface Bulle {
  id: number;
  contenu: string;
  date: string;
  moi: boolean;
  auteur?: string;
  systeme?: boolean;
}

type Onglet = "groupes" | "prives";

export default function MessagesPage() {
  const { me, chargement } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const avec = params.get("avec");
  const groupeId = params.get("groupe");
  const [onglet, setOnglet] = useState<Onglet>(avec ? "prives" : "groupes");
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [groupes, setGroupes] = useState<Groupe[] | null>(null);
  const [contact, setContact] = useState<UserMini | null>(null);

  useEffect(() => {
    if (!chargement && !me) router.replace("/connexion?suivant=/messages");
  }, [chargement, me, router]);

  const charger = useCallback(() => {
    api<Conversation[]>("/conversations/").then(setConversations).catch(() => setConversations([]));
    api<Groupe[]>("/groupes/").then(setGroupes).catch(() => setGroupes([]));
  }, []);

  useEffect(() => {
    if (me) charger();
  }, [me, charger]);

  // L'URL choisit l'onglet : ?avec=<user> → privés, ?groupe=<id> → groupes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (avec) setOnglet("prives");
    else if (groupeId) setOnglet("groupes");
  }, [avec, groupeId]);

  useEffect(() => {
    if (!avec || !me) return;
    const connu = conversations?.find((c) => String(c.user.id) === avec);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (connu) setContact(connu.user);
    else api<UserMini>(`/users/${avec}/contact/`).then(setContact).catch(() => setContact(null));
  }, [avec, me, conversations]);

  if (chargement || !me) return <Chargement />;

  const selection = avec || groupeId;
  const nonLusGroupes = groupes?.reduce((n, g) => n + g.non_lus, 0) ?? 0;
  const nonLusPrives = conversations?.reduce((n, c) => n + c.non_lus, 0) ?? 0;
  const groupeActif = groupes?.find((g) => String(g.id) === groupeId);

  return (
    <div className="conteneur py-4 sm:py-8">
      <h1 className={`mb-4 text-2xl font-extrabold sm:mb-6 sm:text-3xl ${selection ? "max-md:hidden" : ""}`}>Messagerie</h1>
      <div className="carte grid h-[calc(100dvh-10rem)] max-h-[760px] min-h-[460px] grid-cols-[minmax(0,1fr)] overflow-hidden sm:h-[calc(100dvh-14rem)] md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`flex min-h-0 flex-col border-r border-ligne ${selection ? "hidden md:flex" : ""}`}>
          <div className="flex gap-1 border-b border-ligne p-2" role="tablist">
            {([
              ["groupes", "💬 Groupes", nonLusGroupes],
              ["prives", "✉️ Privés", nonLusPrives],
            ] as const).map(([id, lib, n]) => (
              <button
                key={id}
                role="tab"
                aria-selected={onglet === id}
                onClick={() => setOnglet(id)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${onglet === id ? "bg-ink text-white" : "text-ink-soft hover:bg-sable"}`}
              >
                {lib}
                {n > 0 && <span className="ml-1.5 rounded-full bg-corail px-1.5 py-0.5 text-[10px] text-white">{n}</span>}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {onglet === "groupes" ? (
              groupes === null ? (
                <Chargement />
              ) : groupes.length === 0 ? (
                <p className="p-6 text-sm text-ink-soft">
                  Aucun groupe pour l&apos;instant. Rejoignez une activité ou une mission : vous serez ajouté·e automatiquement à
                  son groupe une fois accepté·e.
                </p>
              ) : (
                <ul>
                  {groupes.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={`/messages?groupe=${g.id}`}
                        className={`flex items-center gap-3 border-b border-ligne/60 px-4 py-3 hover:bg-creme ${groupeId === String(g.id) ? "bg-corail-soft/40" : ""} ${g.est_ferme ? "opacity-70" : ""}`}
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sable text-xl">
                          {g.est_ferme ? "🔒" : TYPES_ANNONCE[g.annonce.type].emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex justify-between gap-2">
                            <span className="truncate text-sm font-bold">{g.nom}</span>
                            {g.dernier_message && <span className="shrink-0 text-[11px] text-ink-soft">{ilya(g.dernier_message.date)}</span>}
                          </span>
                          <span className="block truncate text-xs text-ink-soft">
                            {g.est_ferme ? "Groupe fermé · " : `${g.nb_membres ?? ""} membres · `}
                            {g.dernier_message?.contenu}
                          </span>
                        </span>
                        {g.non_lus > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-corail px-1 text-[10px] font-bold text-white">{g.non_lus}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : conversations === null ? (
              <Chargement />
            ) : conversations.length === 0 ? (
              <p className="p-6 text-sm text-ink-soft">Aucune conversation. Contactez un organisateur depuis une annonce !</p>
            ) : (
              <ul>
                {conversations.map((c) => (
                  <li key={c.user.id}>
                    <Link href={`/messages?avec=${c.user.id}`} className={`flex items-center gap-3 border-b border-ligne/60 px-4 py-3 hover:bg-creme ${avec === String(c.user.id) ? "bg-corail-soft/40" : ""}`}>
                      <Avatar nom={c.user.nom_affiche} src={c.user.avatar} taille={42} />
                      <span className="min-w-0 flex-1">
                        <span className="flex justify-between gap-2">
                          <span className="truncate text-sm font-bold">{c.user.nom_affiche}</span>
                          {c.date && <span className="shrink-0 text-[11px] text-ink-soft">{ilya(c.date)}</span>}
                        </span>
                        <span className="block truncate text-xs text-ink-soft">{c.dernier_message}</span>
                      </span>
                      {c.non_lus > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-corail px-1 text-[10px] font-bold text-white">{c.non_lus}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className={`${selection ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
          {groupeId ? (
            groupeActif || groupes === null ? (
              <FilGroupe key={groupeId} id={Number(groupeId)} moiId={me.user.id} onNouveau={charger} />
            ) : (
              <div className="grid flex-1 place-items-center p-6">
                <Vide emoji="🚪" titre="Vous ne faites pas partie de ce groupe" texte="Seuls les participants acceptés y ont accès." />
              </div>
            )
          ) : avec && contact ? (
            <FilPrive key={contact.id} contact={contact} moiId={me.user.id} onNouveau={charger} />
          ) : (
            <div className="grid flex-1 place-items-center p-6">
              <Vide emoji="💬" titre="Sélectionnez une conversation" texte="Groupes d'activité et messages privés, en temps réel." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ================================================================== fil commun */

function Fil({
  bulles,
  enLigne,
  ferme,
  onEnvoyer,
  entete,
  avecAuteurs = false,
}: {
  bulles: Bulle[] | null;
  enLigne: boolean;
  ferme?: string | null;
  onEnvoyer: (texte: string) => void;
  entete: React.ReactNode;
  avecAuteurs?: boolean;
}) {
  const [texte, setTexte] = useState("");
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fait défiler uniquement le fil, pas toute la page
    zone.current?.scrollTo({ top: zone.current.scrollHeight, behavior: "smooth" });
  }, [bulles]);

  return (
    <>
      {entete}
      <div ref={zone} className="flex-1 space-y-2 overflow-y-auto bg-creme/60 px-5 py-4">
        {bulles === null ? (
          <Chargement />
        ) : bulles.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">Démarrez la conversation 👋</p>
        ) : (
          bulles.map((b) =>
            b.systeme ? (
              <p key={b.id} className="mx-auto w-fit max-w-[85%] rounded-full bg-sable px-3 py-1 text-center text-xs text-ink-soft">
                {b.contenu}
              </p>
            ) : (
              <div key={b.id} className={`flex ${b.moi ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${b.moi ? "rounded-br-md bg-corail text-white" : "rounded-bl-md border border-ligne bg-white"}`}>
                  {avecAuteurs && !b.moi && b.auteur && <p className="mb-0.5 text-xs font-bold text-foret">{b.auteur}</p>}
                  <p className="whitespace-pre-line">{b.contenu}</p>
                  <p className={`mt-0.5 text-right text-[10px] ${b.moi ? "text-white/70" : "text-ink-soft"}`}>{heure(b.date)}</p>
                </div>
              </div>
            ),
          )
        )}
      </div>
      {ferme ? (
        <p className="border-t border-ligne bg-sable px-5 py-4 text-center text-sm text-ink-soft">🔒 {ferme}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = texte.trim();
            if (!t) return;
            setTexte("");
            onEnvoyer(t);
          }}
          className="flex gap-2 border-t border-ligne p-3"
        >
          <input value={texte} onChange={(e) => setTexte(e.target.value)} className="champ" placeholder="Votre message…" maxLength={5000} aria-label="Message" />
          <button className="btn-primary" disabled={!texte.trim()}>Envoyer</button>
        </form>
      )}
      {!ferme && !enLigne && <p className="sr-only">Connexion temps réel en cours…</p>}
    </>
  );
}

/* ================================================================== conversation privée */

function FilPrive({ contact, moiId, onNouveau }: { contact: UserMini; moiId: number; onNouveau: () => void }) {
  const [bulles, setBulles] = useState<Bulle[] | null>(null);
  const [enLigne, setEnLigne] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let nb = -1;
    const charger = () =>
      api<Message[]>(`/messages/${contact.id}/`)
        .then((m) => {
          if (nb !== -1 && m.length > nb) onNouveau();
          nb = m.length;
          setBulles((b) => fusion(b, m.map((x) => ({ id: x.id, contenu: x.contenu, date: x.date_envoi, moi: x.is_own }))));
        })
        .catch(() => setBulles((b) => b ?? []));
    charger();
    if (!TEMPS_REEL) {
      const t = setInterval(charger, INTERVALLE_FIL);
      return () => clearInterval(t);
    }
    const socket = new WebSocket(wsUrl(`/ws/chat/${contact.id}/`));
    ws.current = socket;
    socket.onopen = () => setEnLigne(true);
    socket.onclose = () => setEnLigne(false);
    socket.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type !== "chat_message") return;
      setBulles((b) => [...(b ?? []).filter((x) => x.id !== d.message_id), { id: d.message_id, contenu: d.message, date: d.timestamp, moi: d.sender_id === moiId }]);
      onNouveau();
    };
    return () => socket.close();
  }, [contact.id, moiId, onNouveau]);

  const envoyer = async (contenu: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: contenu }));
    } else {
      const m = await api<Message>(`/messages/${contact.id}/send/`, { method: "POST", body: { contenu } });
      setBulles((b) => [...(b ?? []), { id: m.id, contenu: m.contenu, date: m.date_envoi, moi: true }]);
      onNouveau();
    }
  };

  const lienProfil = contact.profil_id ? (contact.type === "ASSOCIATION" ? `/associations/${contact.profil_id}` : `/benevoles/${contact.profil_id}`) : null;

  return (
    <Fil
      bulles={bulles}
      enLigne={enLigne}
      onEnvoyer={envoyer}
      entete={
        <header className="flex items-center gap-3 border-b border-ligne px-5 py-3">
          <Link href="/messages" className="md:hidden" aria-label="Retour">←</Link>
          <Avatar nom={contact.nom_affiche} src={contact.avatar} taille={38} />
          <div className="flex-1">
            {lienProfil ? <Link href={lienProfil} className="font-bold hover:text-corail">{contact.nom_affiche}</Link> : <p className="font-bold">{contact.nom_affiche}</p>}
            <p className="text-xs text-ink-soft">{TEMPS_REEL ? (enLigne ? "🟢 Temps réel actif" : "Connexion…") : "🔄 Mise à jour automatique"}</p>
          </div>
        </header>
      }
    />
  );
}

/* ================================================================== groupe d'activité */

const versBulle = (m: MessageGroupe, moiId: number): Bulle => ({
  id: m.id,
  contenu: m.contenu,
  date: m.date_envoi,
  moi: m.auteur?.id === moiId,
  auteur: m.auteur?.nom_affiche,
  systeme: m.systeme,
});

function FilGroupe({ id, moiId, onNouveau }: { id: number; moiId: number; onNouveau: () => void }) {
  const toast = useToast();
  const [groupe, setGroupe] = useState<Groupe | null>(null);
  const [membres, setMembres] = useState<MembreGroupe[]>([]);
  const [bulles, setBulles] = useState<Bulle[] | null>(null);
  const [enLigne, setEnLigne] = useState(false);
  const [voirMembres, setVoirMembres] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const chargerDetail = useCallback(() => {
    api<{ groupe: Groupe; membres: MembreGroupe[] }>(`/groupes/${id}/`)
      .then((d) => {
        setGroupe(d.groupe);
        setMembres(d.membres);
      })
      .catch(() => setGroupe(null));
  }, [id]);

  useEffect(() => {
    chargerDetail();
    let dernierSysteme = -1;
    const charger = (premier = false) =>
      api<MessageGroupe[]>(`/groupes/${id}/messages/`)
        .then((m) => {
          setBulles((b) => fusion(b, m.map((x) => versBulle(x, moiId))));
          const sys = m.filter((x) => x.systeme).length;
          if (dernierSysteme !== -1 && sys > dernierSysteme) chargerDetail(); // arrivée, départ ou fermeture
          dernierSysteme = sys;
          if (premier) onNouveau(); // met à jour les compteurs de non-lus
        })
        .catch(() => setBulles((b) => b ?? []));
    charger(true);
    if (!TEMPS_REEL) {
      const t = setInterval(() => charger(), INTERVALLE_FIL);
      return () => clearInterval(t);
    }
    const socket = new WebSocket(wsUrl(`/ws/groupe/${id}/`));
    ws.current = socket;
    socket.onopen = () => setEnLigne(true);
    socket.onclose = () => setEnLigne(false);
    socket.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === "error") toast(d.message, "erreur");
      if (d.type !== "groupe_message") return;
      const m = d.message as MessageGroupe;
      setBulles((b) => [...(b ?? []).filter((x) => x.id !== m.id), versBulle(m, moiId)]);
      if (m.systeme) chargerDetail(); // arrivée, départ ou fermeture
    };
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, moiId]);

  const envoyer = async (contenu: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: contenu }));
    } else {
      try {
        const m = await api<MessageGroupe>(`/groupes/${id}/messages/`, { method: "POST", body: { contenu } });
        setBulles((b) => [...(b ?? []), versBulle(m, moiId)]);
      } catch (e) {
        toast((e as Error).message, "erreur");
      }
    }
  };

  const fermer = async () => {
    if (!confirm("Fermer le groupe maintenant ? Plus personne ne pourra écrire.")) return;
    try {
      const g = await api<Groupe>(`/groupes/${id}/fermer/`, { method: "POST" });
      setGroupe(g);
      onNouveau();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  const a = groupe?.annonce;
  const ferme = groupe?.est_ferme
    ? `Groupe fermé${groupe.date_fermeture ? ` le ${dateLongue(groupe.date_fermeture)}` : ""} : l'activité est terminée. L'historique reste consultable.`
    : null;

  return (
    <>
      <Fil
        bulles={bulles}
        enLigne={enLigne}
        ferme={ferme}
        onEnvoyer={envoyer}
        avecAuteurs
        entete={
          <header className="flex items-center gap-3 border-b border-ligne px-5 py-3">
            <Link href="/messages" className="md:hidden" aria-label="Retour">←</Link>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sable text-xl">
              {groupe?.est_ferme ? "🔒" : a ? TYPES_ANNONCE[a.type].emoji : "💬"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{groupe?.nom ?? "…"}</p>
              {a && (
                <Link href={`/missions/${a.id}`} className="block truncate text-xs text-ink-soft hover:text-corail">
                  <Drapeau code={a.pays} /> {a.ville} · {plage(a.date_debut, a.date_fin, a.fuseau_horaire)}
                </Link>
              )}
            </div>
            <button onClick={() => setVoirMembres(true)} className="btn-ghost btn-sm" aria-label="Voir les membres">
              👥 {membres.length}
            </button>
            {groupe?.mon_role === "ORGANISATEUR" && !groupe.est_ferme && (
              <button onClick={fermer} className="btn-ghost btn-sm" title="Fermer le groupe">🔒</button>
            )}
          </header>
        }
      />
      <Modale ouverte={voirMembres} onFermer={() => setVoirMembres(false)} titre={`Membres (${membres.length})`}>
        <p className="mb-3 text-xs text-ink-soft">
          Les participants acceptés sont ajoutés automatiquement ; ceux qui se désistent en sortent. Le groupe se ferme à la fin de
          l&apos;activité.
        </p>
        <ul className="space-y-2">
          {membres.map((m) => (
            <li key={m.user.id} className="flex items-center gap-3">
              <Avatar nom={m.user.nom_affiche} src={m.user.avatar} taille={34} />
              <span className="flex-1 text-sm font-semibold">{m.user.nom_affiche}</span>
              {m.role === "ORGANISATEUR" && <span className="pastille bg-corail-soft text-corail-dark">Organisateur</span>}
              {m.user.id !== moiId && (
                <Link href={`/messages?avec=${m.user.id}`} onClick={() => setVoirMembres(false)} className="btn-ghost btn-sm" aria-label={`Écrire à ${m.user.nom_affiche}`}>
                  ✉️
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Modale>
    </>
  );
}
