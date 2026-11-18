"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Drapeau from "@/components/Drapeau";
import { Chargement, Etoiles, Vide, useToast } from "@/components/ui";
import { telecharger } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { nombre, plage, STATUTS_CANDIDATURE } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { CategorieHistorique, EvenementHistorique, Historique, StatutCandidature } from "@/lib/types";

const CATEGORIES: Record<CategorieHistorique, { libelle: string; icone: string; fond: string }> = {
  ORGANISEE: { libelle: "Créée par moi", icone: "🎉", fond: "bg-corail-soft" },
  PARTICIPATION: { libelle: "Activité rejointe", icone: "🤝", fond: "bg-[#ffe1d6]" },
  BENEVOLAT: { libelle: "Bénévolat", icone: "🙋", fond: "bg-foret-soft" },
  DON: { libelle: "Don", icone: "🎁", fond: "bg-soleil-soft" },
  AVIS_DONNE: { libelle: "Avis donné", icone: "✍️", fond: "bg-lilas" },
  AVIS_RECU: { libelle: "Avis reçu", icone: "⭐", fond: "bg-lilas" },
};

type Filtre = "TOUT" | "ORGANISEE" | "PARTICIPATION" | "BENEVOLAT" | "DON" | "AVIS";

const STATUTS_ANNONCE: Record<string, { libelle: string; classe: string }> = {
  A_VENIR: { libelle: "En ligne", classe: "bg-foret-soft text-foret" },
  TERMINEE: { libelle: "Terminée", classe: "bg-sable text-ink-soft" },
  CLOTUREE: { libelle: "Clôturée", classe: "bg-ink text-white" },
};

const fmtMois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export default function HistoriquePage() {
  const { me, chargement: authCharge } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const filtre = (params.get("filtre") as Filtre | null) ?? "TOUT";
  const [recherche, setRecherche] = useState("");
  const [maintenant] = useState(() => Date.now());

  useEffect(() => {
    if (!authCharge && !me) router.replace("/connexion?suivant=/espace/historique");
  }, [authCharge, me, router]);

  const { data, chargement, erreur } = useApi<Historique>(me ? "/historique/" : null, [me?.user.id]);
  const estCitoyen = me?.user.type === "CITOYEN";

  const filtres: { id: Filtre; libelle: string; nb?: number }[] = useMemo(() => {
    const r = data?.resume;
    const avis = (r?.avis_recus ?? 0) + (r?.avis_donnes ?? 0);
    return estCitoyen
      ? [
          { id: "TOUT", libelle: "Tout" },
          { id: "ORGANISEE", libelle: "🎉 Créées", nb: r?.organisees },
          { id: "PARTICIPATION", libelle: "🤝 Rejointes", nb: r?.participations },
          { id: "BENEVOLAT", libelle: "🙋 Bénévolat", nb: r?.benevolat },
          { id: "DON", libelle: "🎁 Dons", nb: r?.dons },
          { id: "AVIS", libelle: "⭐ Avis", nb: avis },
        ]
      : [
          { id: "TOUT", libelle: "Tout" },
          { id: "ORGANISEE", libelle: "📣 Annonces publiées", nb: r?.organisees },
          { id: "AVIS", libelle: "⭐ Avis", nb: avis },
        ];
  }, [data, estCitoyen]);

  if (authCharge || !me) return <Chargement />;

  const choisir = (f: Filtre) => router.replace(f === "TOUT" ? pathname : `${pathname}?filtre=${f}`, { scroll: false });

  const q = recherche.trim().toLowerCase();
  const evenements = (data?.evenements ?? []).filter((e) => {
    if (filtre === "AVIS" ? !e.categorie.startsWith("AVIS") : filtre !== "TOUT" && e.categorie !== filtre) return false;
    if (q && !`${e.annonce.titre} ${e.annonce.ville} ${e.annonce.organisateur.nom} ${e.details.personne ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const estAVenir = (e: EvenementHistorique) =>
    !e.categorie.startsWith("AVIS") && new Date(e.annonce.date_fin).getTime() >= maintenant && e.statut !== "REFUSEE" && e.statut !== "ANNULEE";
  const aVenir = evenements.filter(estAVenir).sort((a, b) => a.date.localeCompare(b.date));
  const passes = evenements.filter((e) => !estAVenir(e));

  const parMois = passes.reduce<Record<string, EvenementHistorique[]>>((acc, e) => {
    const m = fmtMois.format(new Date(e.date));
    (acc[m] ??= []).push(e);
    return acc;
  }, {});

  const r = data?.resume;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-corail">Mon espace</p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Mon historique</h1>
        <p className="mt-2 text-ink-soft">
          {estCitoyen
            ? "Tout ce que vous avez organisé, rejoint, donné et partagé, au même endroit."
            : "Vos annonces publiées et les avis échangés avec les bénévoles."}
        </p>
      </div>

      {/* Résumé cliquable */}
      {r && (
        <div className={`grid gap-3 ${estCitoyen ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-3"}`}>
          {(estCitoyen
            ? ([
                ["ORGANISEE", r.organisees, "activités créées", "text-corail"],
                ["PARTICIPATION", r.participations, "activités rejointes", "text-ink"],
                ["BENEVOLAT", r.benevolat, `missions · ${nombre(r.heures)} h`, "text-foret"],
                ["DON", r.dons, "dons", "text-[#8a5a00]"],
                ["AVIS", r.avis_recus, "avis reçus", "text-[#5b3fc4]"],
              ] as const)
            : ([
                ["ORGANISEE", r.organisees, "annonces publiées", "text-corail"],
                ["AVIS", r.avis_recus, "avis reçus", "text-[#5b3fc4]"],
                ["TOUT", r.a_venir, "à venir", "text-foret"],
              ] as const)
          ).map(([f, v, lib, couleur]) => (
            <button
              key={lib}
              onClick={() => choisir(f)}
              className={`carte p-4 text-left transition hover:-translate-y-0.5 hover:shadow-carte-hover ${filtre === f && f !== "TOUT" ? "ring-2 ring-ink" : ""}`}
            >
              <p className={`font-display text-3xl font-extrabold ${couleur}`}>{v}</p>
              <p className="text-xs text-ink-soft">{lib}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        {filtres.map((f) => (
          <button
            key={f.id}
            onClick={() => choisir(f.id)}
            aria-pressed={filtre === f.id}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${filtre === f.id ? "border-ink bg-ink text-white" : "border-ligne bg-white text-ink-soft hover:border-ink"}`}
          >
            {f.libelle}
            {f.nb !== undefined && f.nb > 0 && <span className="ml-1.5 text-xs opacity-70">{f.nb}</span>}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 rounded-full border border-ligne bg-white px-3">
          <span aria-hidden>🔎</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher dans l'historique" className="w-40 bg-transparent py-1.5 text-sm outline-none" />
        </label>
      </div>

      {chargement && !data ? (
        <Chargement />
      ) : erreur ? (
        <Vide emoji="🔌" titre="Impossible de charger l'historique" texte={erreur} />
      ) : evenements.length === 0 ? (
        <Vide
          emoji="🌱"
          titre="Rien à afficher ici pour l'instant"
          texte={estCitoyen ? "Rejoignez une activité ou proposez la vôtre : elle apparaîtra dans votre historique." : "Publiez une annonce pour commencer."}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/missions" className="btn-ghost">Explorer les annonces</Link>
              <Link href="/espace/annonce" className="btn-primary">{estCitoyen ? "Proposer une activité" : "Publier une annonce"}</Link>
            </div>
          }
        />
      ) : (
        <>
          {aVenir.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-corail" /> À venir ({aVenir.length})
              </h2>
              <ol className="space-y-3">{aVenir.map((e) => <Element key={e.id} e={e} onErreur={(m) => toast(m, "erreur")} />)}</ol>
            </section>
          )}
          {Object.entries(parMois).map(([mois, liste]) => (
            <section key={mois}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-soft first-letter:uppercase">{mois}</h2>
              <ol className="relative space-y-3 border-l-2 border-ligne pl-5">
                {liste.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-6 h-3 w-3 rounded-full border-2 border-creme bg-ligne" aria-hidden />
                    <Element e={e} onErreur={(m) => toast(m, "erreur")} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function Element({ e, onErreur }: { e: EvenementHistorique; onErreur: (m: string) => void }) {
  const cat = CATEGORIES[e.categorie];
  const a = e.annonce;
  const d = e.details;
  const statutCand = STATUTS_CANDIDATURE[e.statut as StatutCandidature];
  const statutAnnonce = STATUTS_ANNONCE[e.statut];
  const estAvis = e.categorie.startsWith("AVIS");

  return (
    <div className="carte flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${cat.fond}`} aria-hidden>
        {estAvis ? cat.icone : d.icone || cat.icone}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">{cat.libelle}</span>
          {statutCand && <span className={`pastille ${statutCand.classe}`}>{statutCand.libelle}</span>}
          {statutAnnonce && <span className={`pastille ${statutAnnonce.classe}`}>{statutAnnonce.libelle}</span>}
          {d.presence_confirmee && <span className="pastille bg-foret text-white">✓ Présent·e{d.heures ? ` · ${nombre(d.heures)} h` : ""}</span>}
        </div>
        <Link href={`/missions/${a.id}`} className="mt-1 block truncate font-display text-lg font-bold hover:text-corail">
          {a.titre}
        </Link>
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-ink-soft">
          {e.categorie !== "ORGANISEE" && !estAvis && <span>{a.organisateur.nom} ·</span>}
          <Drapeau code={a.pays} libelle /> {a.ville} · {plage(a.date_debut, a.date_fin, a.fuseau_horaire)}
        </p>
        {/* Détails selon la catégorie */}
        {e.categorie === "ORGANISEE" && (
          <p className="mt-1 text-sm">
            👥 <strong>{d.participants}</strong>
            {d.places ? ` / ${d.places}` : ""} participant{(d.participants ?? 0) > 1 ? "s" : ""}
            {(d.demandes ?? 0) > 0 && <span className="ml-2 font-semibold text-corail-dark">· {d.demandes} demande(s) à valider</span>}
          </p>
        )}
        {e.categorie === "DON" && d.quantite_don && (
          <p className="mt-1 text-sm">🎁 {nombre(d.quantite_don)} {d.unite_don} promis</p>
        )}
        {estAvis && (
          <div className="mt-1 text-sm">
            <span className="mr-2"><Etoiles note={d.note} taille="text-sm" /></span>
            <span className="text-ink-soft">{e.categorie === "AVIS_RECU" ? `de ${d.personne}` : `pour ${d.personne}`}</span>
            {d.commentaire && <p className="mt-1 italic text-ink-soft">« {d.commentaire} »</p>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {d.groupe && (
          <Link href={`/messages?groupe=${d.groupe.id}`} className="btn-ghost btn-sm">{d.groupe.est_ferme ? "🔒 Groupe" : "💬 Groupe"}</Link>
        )}
        {d.attestation && d.candidature && (
          <button
            className="btn-primary btn-sm"
            onClick={() => telecharger(`/candidatures/${d.candidature}/attestation/`, `attestation-${d.candidature}.pdf`).catch((err) => onErreur(err.message))}
          >
            📄 Attestation
          </button>
        )}
        {e.categorie === "ORGANISEE" && e.statut === "A_VENIR" && (
          <Link href={`/espace/annonce?id=${a.id}`} className="btn-ghost btn-sm">Modifier</Link>
        )}
        {e.categorie === "ORGANISEE" && (d.demandes ?? 0) > 0 && <Link href="/espace" className="btn-secondary btn-sm">Gérer</Link>}
      </div>
    </div>
  );
}
