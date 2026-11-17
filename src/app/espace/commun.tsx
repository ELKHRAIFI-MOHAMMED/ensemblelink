"use client";

import { useState } from "react";
import { ChoixEtoiles, Modale, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { AvisADonner } from "@/lib/types";

/** Encart « avis à laisser » après les missions terminées (citoyen ↔ association). */
export function AvisEnAttente({ onFait }: { onFait?: () => void }) {
  const { data, recharger } = useApi<AvisADonner[]>("/avis/a-donner/");
  const [cible, setCible] = useState<AvisADonner | null>(null);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  const toast = useToast();

  if (!data?.length) return null;

  const envoyer = async () => {
    if (!cible) return;
    try {
      await api("/avis/", { method: "POST", body: { cible: cible.cible, annonce: cible.annonce, note, commentaire } });
      toast("Merci pour votre avis ⭐");
      setCible(null);
      setCommentaire("");
      setNote(5);
      recharger();
      onFait?.();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  return (
    <section className="carte border-soleil bg-soleil-soft/60 p-5">
      <h2 className="font-display text-lg font-bold">⭐ {data.length} avis à laisser</h2>
      <p className="text-sm text-ink-soft">Votre retour aide toute la communauté à se faire confiance.</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {data.slice(0, 8).map((a) => (
          <li key={`${a.annonce}-${a.cible}`}>
            <button onClick={() => setCible(a)} className="rounded-full border border-ligne bg-white px-3 py-1.5 text-left text-sm hover:border-ink">
              <strong>{a.cible_nom}</strong> <span className="text-ink-soft">· {a.annonce_titre}</span>
            </button>
          </li>
        ))}
      </ul>
      <Modale ouverte={Boolean(cible)} onFermer={() => setCible(null)} titre={`Évaluer ${cible?.cible_nom ?? ""}`}>
        <p className="mb-3 text-sm text-ink-soft">Mission : {cible?.annonce_titre}</p>
        <ChoixEtoiles valeur={note} onChange={setNote} />
        <textarea rows={3} className="champ mt-4" placeholder="Un commentaire (facultatif)" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setCible(null)}>Plus tard</button>
          <button className="btn-primary" onClick={envoyer}>Publier l&apos;avis</button>
        </div>
      </Modale>
    </section>
  );
}

export function Onglets<T extends string>({ onglets, actif, onChange }: { onglets: { id: T; libelle: string; nb?: number }[]; actif: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-sable p-1" role="tablist">
      {onglets.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={actif === o.id}
          onClick={() => onChange(o.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${actif === o.id ? "bg-white shadow-carte" : "text-ink-soft hover:text-ink"}`}
        >
          {o.libelle}
          {o.nb !== undefined && o.nb > 0 && <span className="ml-1.5 rounded-full bg-corail px-1.5 py-0.5 text-[10px] text-white">{o.nb}</span>}
        </button>
      ))}
    </div>
  );
}
