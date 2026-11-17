"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Association, Categorie, Citoyen, Competence } from "@/lib/types";
import { Alerte } from "./ui";

/** Formulaire de profil (création ou modification) pour un citoyen ou une association. */
export function FormCitoyen({ initial, onOk, creation }: { initial?: Citoyen | null; onOk: () => void; creation: boolean }) {
  const { data: competences } = useApi<Competence[]>("/competences/");
  const { data: categories } = useApi<Categorie[]>("/categories/");
  const [f, setF] = useState({
    prenom: initial?.prenom ?? "",
    nom: initial?.nom ?? "",
    ville: initial?.ville ?? "",
    bio: initial?.bio ?? "",
    experiences: initial?.experiences ?? "",
  });
  const [comp, setComp] = useState<number[]>(initial?.competences ?? []);
  const [inter, setInter] = useState<number[]>(initial?.centres_interet ?? []);
  const [photo, setPhoto] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    comp.forEach((c) => fd.append("competences", String(c)));
    inter.forEach((c) => fd.append("centres_interet", String(c)));
    if (photo) fd.append("photo", photo);
    try {
      await api(creation ? "/signup/citoyen/" : "/citoyen/edit/", { method: creation ? "POST" : "PATCH", body: fd });
      onOk();
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Prénom" value={f.prenom} onChange={(v) => setF({ ...f, prenom: v })} required />
        <Champ label="Nom" value={f.nom} onChange={(v) => setF({ ...f, nom: v })} required />
      </div>
      <Champ label="Ville" value={f.ville} onChange={(v) => setF({ ...f, ville: v })} placeholder="Pour vous proposer des missions proches" />
      <div>
        <label className="etiquette" htmlFor="bio">En quelques mots</label>
        <textarea id="bio" rows={3} className="champ" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Ce qui vous motive, vos disponibilités…" />
      </div>
      <div>
        <label className="etiquette" htmlFor="exp">Expériences</label>
        <textarea id="exp" rows={2} className="champ" value={f.experiences} onChange={(e) => setF({ ...f, experiences: e.target.value })} />
      </div>
      <Choix titre="Mes compétences" options={competences ?? []} valeur={comp} onChange={setComp} />
      <Choix titre="Les causes qui m'intéressent" options={(categories ?? []).map((c) => ({ id: c.id, nom: `${c.icone} ${c.nom}` }))} valeur={inter} onChange={setInter} />
      <div>
        <label className="etiquette" htmlFor="photo">Photo de profil</label>
        <input id="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="text-sm" />
      </div>
      {erreur && <Alerte>{erreur}</Alerte>}
      <button className="btn-primary w-full" disabled={envoi}>{envoi ? "Enregistrement…" : creation ? "Créer mon profil" : "Enregistrer"}</button>
    </form>
  );
}

export function FormAssociation({ initial, onOk, creation }: { initial?: Association | null; onOk: () => void; creation: boolean }) {
  const [f, setF] = useState({
    nom: initial?.nom ?? "",
    ville: initial?.ville ?? "",
    adresse: initial?.adresse ?? "",
    description: initial?.description ?? "",
    contact: initial?.contact ?? "",
    telephone: initial?.telephone ?? "",
    site_web: initial?.site_web ?? "",
  });
  const [reseaux, setReseaux] = useState(initial?.reseaux_sociaux?.instagram ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [justif, setJustif] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    fd.append("reseaux_sociaux", JSON.stringify(reseaux ? { ...(initial?.reseaux_sociaux ?? {}), instagram: reseaux } : initial?.reseaux_sociaux ?? {}));
    if (logo) fd.append("logo", logo);
    if (justif) fd.append("document_justificatif", justif);
    try {
      await api(creation ? "/signup/association/" : "/association/edit/", { method: creation ? "POST" : "PATCH", body: fd });
      onOk();
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="space-y-5">
      <Champ label="Nom de l'association" value={f.nom} onChange={(v) => setF({ ...f, nom: v })} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Ville" value={f.ville} onChange={(v) => setF({ ...f, ville: v })} required />
        <Champ label="Adresse" value={f.adresse} onChange={(v) => setF({ ...f, adresse: v })} />
      </div>
      <div>
        <label className="etiquette" htmlFor="desc">Présentation</label>
        <textarea id="desc" rows={4} className="champ" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Votre mission, vos actions, votre public…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Email de contact" value={f.contact} onChange={(v) => setF({ ...f, contact: v })} />
        <Champ label="Téléphone" value={f.telephone} onChange={(v) => setF({ ...f, telephone: v })} />
        <Champ label="Site web" value={f.site_web} onChange={(v) => setF({ ...f, site_web: v })} placeholder="https://" type="url" />
        <Champ label="Instagram" value={reseaux} onChange={setReseaux} placeholder="https://instagram.com/…" type="url" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiquette" htmlFor="logo">Logo</label>
          <input id="logo" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
        {creation && (
          <div>
            <label className="etiquette" htmlFor="justif">Justificatif (statuts, récépissé)</label>
            <input id="justif" type="file" accept=".pdf,image/*" onChange={(e) => setJustif(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
        )}
      </div>
      {creation && <Alerte type="info">Votre association sera vérifiée par un administrateur avant de pouvoir publier des annonces.</Alerte>}
      {erreur && <Alerte>{erreur}</Alerte>}
      <button className="btn-primary w-full" disabled={envoi}>{envoi ? "Enregistrement…" : creation ? "Créer le profil de l'association" : "Enregistrer"}</button>
    </form>
  );
}

function Champ({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="etiquette">{label}</label>
      <input id={id} className="champ" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}

function Choix({ titre, options, valeur, onChange }: { titre: string; options: { id: number; nom: string }[]; valeur: number[]; onChange: (v: number[]) => void }) {
  return (
    <fieldset>
      <legend className="etiquette">{titre}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const actif = valeur.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(actif ? valeur.filter((x) => x !== o.id) : [...valeur, o.id])}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${actif ? "border-corail bg-corail-soft font-semibold text-corail-dark" : "border-ligne bg-white text-ink-soft hover:border-ink"}`}
            >
              {o.nom}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
