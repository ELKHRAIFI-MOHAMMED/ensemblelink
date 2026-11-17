"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Chargement, Vide } from "@/components/ui";
import { api, wsUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { heure, ilya } from "@/lib/format";
import type { Conversation, Message, UserMini } from "@/lib/types";

interface Bulle {
  id: number;
  contenu: string;
  date: string;
  moi: boolean;
}

export default function MessagesPage() {
  const { me, chargement } = useAuth();
  const router = useRouter();
  const avec = useSearchParams().get("avec");
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [contact, setContact] = useState<UserMini | null>(null);

  useEffect(() => {
    if (!chargement && !me) router.replace("/connexion?suivant=/messages");
  }, [chargement, me, router]);

  const chargerConversations = useCallback(() => {
    api<Conversation[]>("/conversations/").then(setConversations).catch(() => setConversations([]));
  }, []);

  useEffect(() => {
     
    if (me) chargerConversations();
  }, [me, chargerConversations]);

  useEffect(() => {
    if (!avec || !me) return;
    const connu = conversations?.find((c) => String(c.user.id) === avec);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (connu) setContact(connu.user);
    else api<UserMini>(`/users/${avec}/contact/`).then(setContact).catch(() => setContact(null));
  }, [avec, me, conversations]);

  if (chargement || !me) return <Chargement />;

  return (
    <div className="conteneur py-8">
      <h1 className="mb-6 text-3xl font-extrabold">Messagerie</h1>
      <div className="carte grid h-[calc(100vh-14rem)] max-h-[760px] min-h-[480px] overflow-hidden md:grid-cols-[300px_1fr]">
        <aside className={`border-r border-ligne ${avec ? "hidden md:block" : ""} overflow-y-auto`}>
          {conversations === null ? (
            <Chargement />
          ) : conversations.length === 0 ? (
            <p className="p-6 text-sm text-ink-soft">Aucune conversation. Contactez une association depuis une mission !</p>
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
        </aside>
        <section className={`${avec ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
          {avec && contact ? (
            <Fil key={contact.id} contact={contact} moiId={me.user.id} onNouveau={chargerConversations} />
          ) : (
            <div className="grid flex-1 place-items-center p-6">
              <Vide emoji="💬" titre="Sélectionnez une conversation" texte="Les messages sont échangés en temps réel." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Fil({ contact, moiId, onNouveau }: { contact: UserMini; moiId: number; onNouveau: () => void }) {
  const [bulles, setBulles] = useState<Bulle[] | null>(null);
  const [texte, setTexte] = useState("");
  const [enLigne, setEnLigne] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Message[]>(`/messages/${contact.id}/`).then((m) =>
      setBulles(m.map((x) => ({ id: x.id, contenu: x.contenu, date: x.date_envoi, moi: x.is_own }))),
    );
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

  useEffect(() => {
    // Fait défiler uniquement le fil, pas toute la page
    zone.current?.scrollTo({ top: zone.current.scrollHeight, behavior: "smooth" });
  }, [bulles]);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu) return;
    setTexte("");
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: contenu }));
    } else {
      // Repli HTTP si le WebSocket est indisponible
      const m = await api<Message>(`/messages/${contact.id}/send/`, { method: "POST", body: { contenu } });
      setBulles((b) => [...(b ?? []), { id: m.id, contenu: m.contenu, date: m.date_envoi, moi: true }]);
      onNouveau();
    }
  };

  const lienProfil = contact.profil_id ? (contact.type === "ASSOCIATION" ? `/associations/${contact.profil_id}` : `/benevoles/${contact.profil_id}`) : null;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-ligne px-5 py-3">
        <Link href="/messages" className="md:hidden" aria-label="Retour">←</Link>
        <Avatar nom={contact.nom_affiche} src={contact.avatar} taille={38} />
        <div className="flex-1">
          {lienProfil ? <Link href={lienProfil} className="font-bold hover:text-corail">{contact.nom_affiche}</Link> : <p className="font-bold">{contact.nom_affiche}</p>}
          <p className="text-xs text-ink-soft">{enLigne ? "🟢 Temps réel actif" : "Connexion…"}</p>
        </div>
      </header>
      <div ref={zone} className="flex-1 space-y-2 overflow-y-auto bg-creme/60 px-5 py-4">
        {bulles === null ? (
          <Chargement />
        ) : bulles.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">Démarrez la conversation avec {contact.nom_affiche} 👋</p>
        ) : (
          bulles.map((b) => (
            <div key={b.id} className={`flex ${b.moi ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${b.moi ? "rounded-br-md bg-corail text-white" : "rounded-bl-md border border-ligne bg-white"}`}>
                <p className="whitespace-pre-line">{b.contenu}</p>
                <p className={`mt-0.5 text-right text-[10px] ${b.moi ? "text-white/70" : "text-ink-soft"}`}>{heure(b.date)}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={envoyer} className="flex gap-2 border-t border-ligne p-3">
        <input value={texte} onChange={(e) => setTexte(e.target.value)} className="champ" placeholder="Votre message…" maxLength={5000} aria-label="Message" />
        <button className="btn-primary" disabled={!texte.trim()}>Envoyer</button>
      </form>
    </>
  );
}
