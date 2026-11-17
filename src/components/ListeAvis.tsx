import { dateLongue } from "@/lib/format";
import type { Avis } from "@/lib/types";
import { Avatar, Etoiles } from "./ui";

export default function ListeAvis({ avis }: { avis: Avis[] }) {
  if (!avis.length) return <p className="text-sm text-ink-soft">Pas encore d&apos;avis.</p>;
  return (
    <ul className="space-y-3">
      {avis.map((a) => (
        <li key={a.id} className="carte p-5">
          <div className="flex items-center gap-3">
            <Avatar nom={a.auteur.nom_affiche} src={a.auteur.avatar} taille={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{a.auteur.nom_affiche}</p>
              <p className="truncate text-xs text-ink-soft">{a.annonce_titre} · {dateLongue(a.date_creation)}</p>
            </div>
            <Etoiles note={a.note} taille="text-sm" />
          </div>
          {a.commentaire && <p className="mt-3 text-sm leading-relaxed text-ink-soft">« {a.commentaire} »</p>}
        </li>
      ))}
    </ul>
  );
}
