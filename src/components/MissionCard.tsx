import Link from "next/link";
import { plage, TYPES_ANNONCE } from "@/lib/format";
import type { Annonce } from "@/lib/types";
import { Avatar, Barre } from "./ui";

export default function MissionCard({ a }: { a: Annonce }) {
  const type = TYPES_ANNONCE[a.type];
  const cat = a.categorie_detail;
  const couleur = cat?.couleur ?? "#F26B3A";
  const objectif = a.objectif_don ? Number(a.objectif_don) : null;

  return (
    <Link
      href={`/missions/${a.id}`}
      className="carte group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-carte-hover"
    >
      {/* Visuel : image de l'annonce, sinon illustration de la catégorie */}
      <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(135deg, ${couleur}22, ${couleur}55)` }}>
        {a.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <span className="absolute -bottom-4 -right-2 select-none text-[96px] leading-none opacity-90 transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110" aria-hidden>
            {cat?.icone ?? type.emoji}
          </span>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={`pastille ${type.classe}`}>{type.libelle}</span>
          {a.est_complete && <span className="pastille bg-ink text-white">Complet</span>}
          {a.est_terminee && <span className="pastille bg-white text-ink-soft">Terminée</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          <Avatar nom={a.association.nom} src={a.association.logo} taille={22} />
          <span className="truncate">{a.association.nom}</span>
        </div>
        <h3 className="font-display text-lg font-bold leading-snug group-hover:text-corail">{a.titre}</h3>
        <div className="mt-auto space-y-1.5 text-sm text-ink-soft">
          <p className="flex items-center gap-2">
            <span aria-hidden>📍</span>
            {a.ville || a.lieu}
          </p>
          <p className="flex items-center gap-2">
            <span aria-hidden>🗓️</span>
            {plage(a.date_debut, a.date_fin)}
          </p>
        </div>
        {a.type === "DON" && objectif ? (
          <div className="space-y-1.5 pt-1">
            <Barre valeur={a.quantite_collectee} max={objectif} couleur="bg-soleil" />
            <p className="text-xs text-ink-soft">
              <strong className="text-ink">{a.quantite_collectee}</strong> / {objectif} {a.unite_don} collectés
            </p>
          </div>
        ) : a.places_restantes !== null ? (
          <p className="text-xs font-semibold text-foret">
            {a.places_restantes > 0 ? `${a.places_restantes} place${a.places_restantes > 1 ? "s" : ""} restante${a.places_restantes > 1 ? "s" : ""}` : "Liste complète"}
          </p>
        ) : (
          <p className="text-xs font-semibold text-foret">Places illimitées</p>
        )}
      </div>
    </Link>
  );
}
