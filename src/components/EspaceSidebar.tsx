"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { profilAssociation, profilCitoyen, useAuth } from "@/lib/auth";
import { nombre } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Historique } from "@/lib/types";
import { Avatar } from "./ui";

interface Lien {
  href: string;
  libelle: string;
  icone: string;
  nb?: number;
}

/** Barre latérale de « Mon espace » : accès direct à l'historique, aux activités créées et aux engagements. */
export default function EspaceSidebar() {
  const { me } = useAuth();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data: histo } = useApi<Historique>(me && me.user.type !== "ADMIN" ? "/historique/" : null, [me?.user.id, pathname]);

  if (!me || (!me.profil && me.user.type !== "ADMIN")) return null;

  const r = histo?.resume;
  const citoyen = profilCitoyen(me);
  const asso = profilAssociation(me);
  const nom = citoyen ? `${citoyen.prenom} ${citoyen.nom}` : asso ? asso.nom : me.user.username;
  const avatar = citoyen?.photo ?? asso?.logo ?? null;

  const groupes: { titre: string; liens: Lien[] }[] =
    me.user.type === "ADMIN"
      ? [{ titre: "Administration", liens: [{ href: "/espace", libelle: "Tableau de bord", icone: "🛡️" }, { href: "/messages", libelle: "Messages", icone: "💬" }] }]
      : [
          {
            titre: "Mon espace",
            liens: [
              { href: "/espace", libelle: "Tableau de bord", icone: "🏠" },
              { href: "/espace/historique", libelle: "Mon historique", icone: "🕘", nb: r?.a_venir },
            ],
          },
          {
            titre: citoyen ? "Mes engagements" : "Mon activité",
            liens: citoyen
              ? [
                  { href: "/espace/historique?filtre=ORGANISEE", libelle: "Activités créées", icone: "🎉", nb: r?.organisees },
                  { href: "/espace/historique?filtre=PARTICIPATION", libelle: "Activités rejointes", icone: "🤝", nb: r?.participations },
                  { href: "/espace/historique?filtre=BENEVOLAT", libelle: "Bénévolat", icone: "🙋", nb: r?.benevolat },
                  { href: "/espace/historique?filtre=DON", libelle: "Mes dons", icone: "🎁", nb: r?.dons },
                  { href: "/espace/historique?filtre=AVIS", libelle: "Avis", icone: "⭐", nb: (r?.avis_recus ?? 0) + (r?.avis_donnes ?? 0) },
                ]
              : [
                  { href: "/espace/historique?filtre=ORGANISEE", libelle: "Annonces publiées", icone: "📣", nb: r?.organisees },
                  { href: "/espace/historique?filtre=AVIS", libelle: "Avis", icone: "⭐", nb: (r?.avis_recus ?? 0) + (r?.avis_donnes ?? 0) },
                ],
          },
          {
            titre: "Compte",
            liens: [
              { href: "/messages", libelle: "Messages & groupes", icone: "💬" },
              { href: "/espace/profil", libelle: "Modifier mon profil", icone: "👤" },
              ...(citoyen ? [{ href: `/benevoles/${citoyen.id}`, libelle: "Profil public", icone: "🌐" }] : []),
              ...(asso?.statut_verification === "VERIFIEE" ? [{ href: `/associations/${asso.id}`, libelle: "Page publique", icone: "🌐" }] : []),
            ],
          },
        ];

  const actif = (href: string) => {
    const [chemin, query] = href.split("?");
    if (chemin !== pathname) return false;
    const filtre = new URLSearchParams(query ?? "").get("filtre");
    return (params.get("filtre") ?? null) === filtre;
  };

  const peutPublier = citoyen || asso?.statut_verification === "VERIFIEE";

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Navigation de mon espace">
      {/* Carte profil (desktop) */}
      <div className="carte mb-4 hidden items-center gap-3 p-4 lg:flex">
        <Avatar nom={nom} src={avatar} taille={44} carre={Boolean(asso)} />
        <div className="min-w-0">
          <p className="truncate font-display font-bold">{nom}</p>
          <p className="text-xs text-ink-soft">
            {citoyen ? `${nombre(r?.heures ?? 0)} h de bénévolat` : asso ? "Association" : "Administrateur"}
          </p>
        </div>
      </div>

      {peutPublier && (
        <Link href="/espace/annonce" className="btn-primary mb-4 hidden w-full lg:flex">
          + {citoyen ? "Proposer une activité" : "Publier une annonce"}
        </Link>
      )}

      <nav className="carte flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-0 lg:overflow-visible">
        {groupes.map((g, i) => (
          <div key={g.titre} className={`flex gap-1 lg:block ${i > 0 ? "lg:mt-2 lg:border-t lg:border-ligne lg:pt-2" : ""}`}>
            <p className="hidden px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-ink-soft/70 lg:block">{g.titre}</p>
            {g.liens.map((l) => {
              const estActif = actif(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={estActif ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    estActif ? "bg-ink font-semibold text-white" : "text-ink-soft hover:bg-sable hover:text-ink"
                  }`}
                >
                  <span aria-hidden className="text-base">{l.icone}</span>
                  <span className="whitespace-nowrap lg:flex-1">{l.libelle}</span>
                  {l.nb !== undefined && l.nb > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${estActif ? "bg-white/20 text-white" : "bg-sable text-ink"}`}>{l.nb}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
