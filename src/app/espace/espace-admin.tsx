"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Chargement, Modale, Stat, Vide, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { dateLongue, ilya, nombre, STATUTS_VERIF } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Association, Categorie, Paginated, Signalement, User } from "@/lib/types";
import { Onglets } from "./commun";

type Onglet = "verifications" | "signalements" | "comptes" | "categories";

interface Dashboard {
  associations: number;
  benevoles: number;
  missions_actives: number;
  heures_benevolat: number;
  associations_en_attente: number;
  signalements_ouverts: number;
  utilisateurs: number;
  comptes_inactifs: number;
}

export default function EspaceAdmin() {
  const [onglet, setOnglet] = useState<Onglet>("verifications");
  const dash = useApi<Dashboard>("/admin/dashboard/");
  const d = dash.data;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-corail">Administration</p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Tableau de bord</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat valeur={d?.utilisateurs ?? "…"} libelle={`comptes (${d?.comptes_inactifs ?? 0} inactifs)`} />
        <Stat valeur={d?.associations ?? "…"} libelle="associations vérifiées" accent="text-foret" />
        <Stat valeur={d?.missions_actives ?? "…"} libelle="missions actives" />
        <Stat valeur={d ? `${nombre(d.heures_benevolat)} h` : "…"} libelle="de bénévolat validées" accent="text-corail" />
      </div>
      <Onglets
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "verifications", libelle: "Vérifications", nb: d?.associations_en_attente },
          { id: "signalements", libelle: "Signalements", nb: d?.signalements_ouverts },
          { id: "comptes", libelle: "Comptes" },
          { id: "categories", libelle: "Catégories" },
        ]}
      />
      {onglet === "verifications" && <Verifications onChange={dash.recharger} />}
      {onglet === "signalements" && <Signalements onChange={dash.recharger} />}
      {onglet === "comptes" && <Comptes onChange={dash.recharger} />}
      {onglet === "categories" && <Categories />}
    </div>
  );
}

function Verifications({ onChange }: { onChange: () => void }) {
  const [statut, setStatut] = useState("EN_ATTENTE");
  const { data, chargement, recharger } = useApi<Paginated<Association>>(`/admin/associations/?page_size=100&statut_verification=${statut}`);
  const [rejet, setRejet] = useState<Association | null>(null);
  const [motif, setMotif] = useState("");
  const toast = useToast();

  const decider = async (a: Association, decision: "VERIFIEE" | "REJETEE", m = "") => {
    try {
      await api(`/admin/associations/${a.id}/verifier/`, { method: "POST", body: { decision, motif: m } });
      toast(decision === "VERIFIEE" ? `${a.nom} est vérifiée ✅` : `${a.nom} a été rejetée`);
      setRejet(null);
      setMotif("");
      recharger();
      onChange();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex gap-2">
        {Object.entries(STATUTS_VERIF).map(([s, v]) => (
          <button key={s} onClick={() => setStatut(s)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${statut === s ? "border-ink bg-ink text-white" : "border-ligne bg-white text-ink-soft"}`}>{v.libelle}</button>
        ))}
      </div>
      {chargement && !data ? <Chargement /> : !data?.results.length ? <Vide emoji="✅" titre="Rien à traiter" /> : (
        <ul className="space-y-3">
          {data.results.map((a) => (
            <li key={a.id} className="carte flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <Avatar nom={a.nom} src={a.logo} taille={52} carre />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold">{a.nom}</p>
                <p className="text-sm text-ink-soft">📍 {a.ville} · {a.email} · inscrite le {dateLongue(a.date_creation)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{a.description}</p>
                {a.motif_rejet && <p className="mt-1 text-sm text-[#a32626]">Motif : {a.motif_rejet}</p>}
              </div>
              <div className="flex gap-2">
                {a.statut_verification !== "VERIFIEE" && <button className="btn-secondary btn-sm" onClick={() => decider(a, "VERIFIEE")}>Valider</button>}
                {a.statut_verification !== "REJETEE" && <button className="btn-ghost btn-sm" onClick={() => setRejet(a)}>Rejeter</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modale ouverte={Boolean(rejet)} onFermer={() => setRejet(null)} titre={`Rejeter ${rejet?.nom ?? ""}`}>
        <textarea rows={3} className="champ" placeholder="Motif communiqué à l'association" value={motif} onChange={(e) => setMotif(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setRejet(null)}>Annuler</button>
          <button className="btn-primary" disabled={!motif.trim()} onClick={() => rejet && decider(rejet, "REJETEE", motif)}>Confirmer le rejet</button>
        </div>
      </Modale>
    </section>
  );
}

function Signalements({ onChange }: { onChange: () => void }) {
  const { data, chargement, recharger } = useApi<Paginated<Signalement>>("/admin/signalements/?page_size=100");
  const toast = useToast();
  const traiter = async (s: Signalement, statut: "TRAITE" | "REJETE") => {
    await api(`/admin/signalements/${s.id}/`, { method: "PATCH", body: { statut } });
    toast("Signalement mis à jour");
    recharger();
    onChange();
  };
  if (chargement && !data) return <Chargement />;
  if (!data?.results.length) return <Vide emoji="🕊️" titre="Aucun signalement" />;
  return (
    <ul className="space-y-3">
      {data.results.map((s) => (
        <li key={s.id} className="carte flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="text-sm">
              <strong>{s.auteur.nom_affiche}</strong> signale{" "}
              {s.annonce ? <Link href={`/missions/${s.annonce}`} className="font-semibold text-corail hover:underline">« {s.annonce_titre} »</Link> : <strong>{s.utilisateur_signale_detail?.nom_affiche}</strong>}
              <span className="text-ink-soft"> · {ilya(s.date_creation)}</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">{s.motif}</p>
          </div>
          {s.statut === "OUVERT" ? (
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" onClick={() => traiter(s, "TRAITE")}>Marquer traité</button>
              <button className="btn-ghost btn-sm" onClick={() => traiter(s, "REJETE")}>Rejeter</button>
            </div>
          ) : (
            <span className="pastille bg-sable text-ink-soft">{s.statut === "TRAITE" ? "Traité" : "Rejeté"}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Comptes({ onChange }: { onChange: () => void }) {
  const [type, setType] = useState("");
  const [recherche, setRecherche] = useState("");
  const { data, chargement, recharger } = useApi<Paginated<User>>(`/admin/users/?page_size=100&type=${type}&search=${encodeURIComponent(recherche)}`);
  const toast = useToast();
  const basculer = async (u: User) => {
    try {
      const r = await api<{ message: string }>(`/activate/${u.id}/`, { method: "POST" });
      toast(r.message);
      recharger();
      onChange();
    } catch (e) {
      toast((e as Error).message, "erreur");
    }
  };
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className="champ max-w-xs" placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <select className="champ w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">Tous les rôles</option>
          <option value="CITOYEN">Citoyens</option>
          <option value="ASSOCIATION">Associations</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>
      {chargement && !data ? <Chargement /> : (
        <div className="carte overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-ligne text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr><th className="px-5 py-3">Utilisateur</th><th>Email</th><th>Rôle</th><th>Inscription</th><th className="px-5 text-right">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-ligne">
              {data?.results.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-semibold">{u.username}</td>
                  <td className="text-ink-soft">{u.email}</td>
                  <td><span className="pastille bg-sable">{u.type}</span></td>
                  <td className="text-ink-soft">{u.date_joined ? dateLongue(u.date_joined) : "—"}</td>
                  <td className="px-5 text-right">
                    <button onClick={() => basculer(u)} className={`btn-sm btn ${u.is_active ? "bg-foret-soft text-foret hover:bg-[#fde2e2] hover:text-[#a32626]" : "bg-[#fde2e2] text-[#a32626] hover:bg-foret-soft hover:text-foret"}`}>
                      {u.is_active ? "Actif" : "Désactivé"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Categories() {
  const { data, recharger } = useApi<Categorie[]>("/categories/");
  const [nom, setNom] = useState("");
  const [icone, setIcone] = useState("✨");
  const toast = useToast();
  const ajouter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/categories/", { method: "POST", body: { nom, icone } });
      setNom("");
      recharger();
      toast("Catégorie ajoutée");
    } catch (err) {
      toast((err as Error).message, "erreur");
    }
  };
  const supprimer = async (c: Categorie) => {
    if (!confirm(`Supprimer « ${c.nom} » ?`)) return;
    await api(`/categories/${c.id}/`, { method: "DELETE" });
    recharger();
  };
  return (
    <section className="space-y-4">
      <form onSubmit={ajouter} className="carte flex flex-wrap gap-2 p-4">
        <input className="champ w-20 text-center" value={icone} onChange={(e) => setIcone(e.target.value)} aria-label="Emoji" />
        <input className="champ flex-1" placeholder="Nouvelle catégorie" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <button className="btn-primary">Ajouter</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((c) => (
          <div key={c.id} className="carte flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-xl" style={{ background: `${c.couleur}22` }}>{c.icone}</span>
            <span className="flex-1"><span className="block font-semibold">{c.nom}</span><span className="text-xs text-ink-soft">{c.nombre_annonces} annonce(s)</span></span>
            <button onClick={() => supprimer(c)} className="rounded-full p-2 text-ink-soft hover:bg-[#fff1f1] hover:text-[#a32626]" aria-label={`Supprimer ${c.nom}`}>🗑</button>
          </div>
        ))}
      </div>
    </section>
  );
}
