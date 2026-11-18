"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alerte, Chargement, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TYPES_ANNONCE, versInputDate } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { libelleFuseau, PAYS } from "@/lib/pays";
import type { Annonce, AnnonceType, Categorie, Competence } from "@/lib/types";

const ChoixPosition = dynamic(() => import("@/components/ChoixPosition"), { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-xl2 bg-sable" /> });

const VIDE = {
  titre: "",
  description: "",
  type: "APPEL_BENEVOLAT" as AnnonceType,
  categorie: "",
  lieu: "",
  ville: "",
  date_debut: "",
  date_fin: "",
  nombre_places: "",
  objectif_don: "",
  unite_don: "",
  pays: "FR",
  fuseau_horaire: "Europe/Paris",
};

export default function FormAnnoncePage() {
  const id = useSearchParams().get("id");
  const { me, chargement: authCharge } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { data: categories } = useApi<Categorie[]>("/categories/");
  const { data: competences } = useApi<Competence[]>("/competences/");
  const { data: existante, chargement } = useApi<Annonce>(id ? `/annonces/${id}/` : null);

  const [f, setF] = useState(VIDE);
  const [comp, setComp] = useState<number[]>([]);
  const [pos, setPos] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [image, setImage] = useState<File | null>(null);
  const [inscriptionAuto, setInscriptionAuto] = useState(false);
  const estCitoyen = me?.user.type === "CITOYEN";
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!authCharge && me?.user.type !== "ASSOCIATION" && me?.user.type !== "CITOYEN") router.replace("/espace");
  }, [authCharge, me, router]);

  // Nouvelle annonce : pays du profil, type « Activité » pour un citoyen (inscription libre par défaut)
  useEffect(() => {
    if (id || !me?.profil) return;
    const pays = (me.profil as { pays?: string }).pays || "FR";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF((prev) => ({
      ...prev,
      pays,
      fuseau_horaire: PAYS[pays]?.fuseaux[0] ?? "Europe/Paris",
      ville: prev.ville || (me.profil as { ville?: string }).ville || "",
      type: me.user.type === "CITOYEN" ? "ACTIVITE" : prev.type,
    }));
    setInscriptionAuto(me.user.type === "CITOYEN");
  }, [id, me]);

  useEffect(() => {
    if (!existante) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF({
      titre: existante.titre,
      description: existante.description,
      type: existante.type,
      categorie: existante.categorie ? String(existante.categorie) : "",
      lieu: existante.lieu,
      ville: existante.ville,
      date_debut: versInputDate(existante.date_debut, existante.fuseau_horaire),
      date_fin: versInputDate(existante.date_fin, existante.fuseau_horaire),
      nombre_places: existante.nombre_places ? String(existante.nombre_places) : "",
      objectif_don: existante.objectif_don ? String(Number(existante.objectif_don)) : "",
      unite_don: existante.unite_don,
      pays: existante.pays,
      fuseau_horaire: existante.fuseau_horaire,
    });
    setInscriptionAuto(existante.inscription_automatique);
    setComp(existante.competences_requises);
    setPos({ lat: existante.latitude ? Number(existante.latitude) : null, lng: existante.longitude ? Number(existante.longitude) : null });
  }, [existante]);

  if (authCharge || (id && chargement)) return <Chargement />;

  const set = (k: keyof typeof VIDE) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => {
      if (k === "objectif_don" && f.type !== "DON") return;
      if (v !== "" || id) fd.append(k, v);
    });
    fd.append("inscription_automatique", String(f.type !== "DON" && inscriptionAuto));
    comp.forEach((c) => fd.append("competences_requises", String(c)));
    if (pos.lat !== null && pos.lng !== null) {
      fd.append("latitude", pos.lat.toFixed(6));
      fd.append("longitude", pos.lng.toFixed(6));
    } else if (id) {
      fd.append("latitude", "");
      fd.append("longitude", "");
    }
    if (image) fd.append("image", image);
    try {
      const a = await api<Annonce>(id ? `/annonces/${id}/` : "/annonces/", { method: id ? "PATCH" : "POST", body: fd });
      toast(id ? "Annonce mise à jour" : "Annonce publiée 🎉");
      router.push(`/missions/${a.id}`);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link href="/espace" className="text-sm font-semibold text-ink-soft hover:text-ink">← Mon espace</Link>
      <h1 className="mt-3 text-4xl font-extrabold">
        {id ? "Modifier l'annonce" : estCitoyen ? "Proposer une activité" : "Publier une annonce"}
      </h1>
      {estCitoyen && !id && (
        <p className="mt-2 text-ink-soft">
          Match de foot, club de lecture, pique-nique, randonnée, soirée jeux… Proposez n&apos;importe quelle activité, les
          autres citoyens peuvent la rejoindre.
        </p>
      )}

      <form onSubmit={soumettre} className="mt-8 space-y-8">
        <fieldset className="carte min-w-0 space-y-5 p-4 sm:p-6">
          <legend className="sr-only">Type</legend>
          {!estCitoyen && <p className="etiquette">Type d&apos;annonce</p>}
          <div className={`grid gap-3 sm:grid-cols-4 ${estCitoyen ? "hidden" : ""}`}>
            {(Object.keys(TYPES_ANNONCE) as AnnonceType[]).map((t) => (
              <button type="button" key={t} onClick={() => setF({ ...f, type: t })} aria-pressed={f.type === t} className={`rounded-2xl border p-4 text-left transition ${f.type === t ? "border-corail bg-corail-soft/50 ring-4 ring-corail/10" : "border-ligne hover:border-ink"}`}>
                <span className="text-2xl">{TYPES_ANNONCE[t].emoji}</span>
                <span className="mt-1 block font-bold">{TYPES_ANNONCE[t].libelle}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="etiquette" htmlFor="titre">Titre</label>
            <input id="titre" className="champ" required maxLength={255} value={f.titre} onChange={set("titre")} placeholder={estCitoyen ? "ex. Match de foot du dimanche" : "ex. Distribution de repas chauds"} />
          </div>
          <div>
            <label className="etiquette" htmlFor="desc">Description</label>
            <textarea id="desc" rows={5} className="champ" required value={f.description} onChange={set("description")} placeholder="Déroulé, public, ce qu'il faut apporter…" />
          </div>
          <div>
            <label className="etiquette" htmlFor="cat">Catégorie</label>
            <select id="cat" className="champ" value={f.categorie} onChange={set("categorie")}>
              <option value="">—</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
            </select>
          </div>
        </fieldset>

        <fieldset className="carte min-w-0 space-y-5 p-4 sm:p-6">
          <h2 className="font-display text-lg font-bold">Quand et où ?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="etiquette" htmlFor="pays">Pays</label>
              <select
                id="pays"
                className="champ"
                value={f.pays}
                onChange={(e) => setF({ ...f, pays: e.target.value, fuseau_horaire: PAYS[e.target.value].fuseaux[0] })}
              >
                {Object.entries(PAYS).map(([code, p]) => (
                  <option key={code} value={code}>{p.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="etiquette" htmlFor="tz">Fuseau horaire</label>
              <select id="tz" className="champ" value={f.fuseau_horaire} onChange={set("fuseau_horaire")} disabled={(PAYS[f.pays]?.fuseaux.length ?? 1) < 2}>
                {(PAYS[f.pays]?.fuseaux ?? [f.fuseau_horaire]).map((tz) => (
                  <option key={tz} value={tz}>{libelleFuseau(tz)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="etiquette" htmlFor="debut">Début</label>
              <input id="debut" type="datetime-local" className="champ" required value={f.date_debut} onChange={set("date_debut")} />
            </div>
            <div>
              <label className="etiquette" htmlFor="fin">Fin</label>
              <input id="fin" type="datetime-local" className="champ" required min={f.date_debut} value={f.date_fin} onChange={set("date_fin")} />
            </div>
            <p className="-mt-2 text-xs text-ink-soft sm:col-span-2">Heures locales du lieu ({libelleFuseau(f.fuseau_horaire)}).</p>
            <div>
              <label className="etiquette" htmlFor="lieu">Lieu</label>
              <input id="lieu" className="champ" required value={f.lieu} onChange={set("lieu")} placeholder="Adresse ou nom du lieu" />
            </div>
            <div>
              <label className="etiquette" htmlFor="ville">Ville</label>
              <input id="ville" className="champ" value={f.ville} onChange={set("ville")} />
            </div>
          </div>
          <div>
            <p className="etiquette">Position sur la carte <span className="font-normal text-ink-soft">(cliquez pour placer le lieu)</span></p>
            <div className="overflow-hidden rounded-xl2 border border-ligne">
              <ChoixPosition
                key={pos.lat === null ? f.pays : "position"}
                lat={pos.lat}
                lng={pos.lng}
                centre={PAYS[f.pays]?.centre}
                zoom={PAYS[f.pays]?.zoom}
                onChoix={(lat, lng) => setPos({ lat, lng })}
              />
            </div>
            {pos.lat !== null && (
              <button type="button" className="mt-2 text-xs text-ink-soft underline" onClick={() => setPos({ lat: null, lng: null })}>Retirer la position</button>
            )}
          </div>
        </fieldset>

        <fieldset className="carte min-w-0 space-y-5 p-4 sm:p-6">
          <h2 className="font-display text-lg font-bold">
            {f.type === "DON" ? "Objectif de collecte" : f.type === "ACTIVITE" ? "Participants" : "Bénévoles"}
          </h2>
          {f.type === "DON" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="etiquette" htmlFor="obj">Objectif</label>
                <input id="obj" type="number" min="1" className="champ" value={f.objectif_don} onChange={set("objectif_don")} />
              </div>
              <div>
                <label className="etiquette" htmlFor="unite">Unité</label>
                <input id="unite" className="champ" value={f.unite_don} onChange={set("unite_don")} placeholder="kg, couvertures, livres, €…" />
              </div>
            </div>
          ) : (
            <div>
              <label className="etiquette" htmlFor="places">Nombre de places</label>
              <input id="places" type="number" min="1" className="champ max-w-40" value={f.nombre_places} onChange={set("nombre_places")} placeholder="Illimité" />
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-ligne p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-corail" checked={inscriptionAuto} onChange={(e) => setInscriptionAuto(e.target.checked)} />
                <span>
                  <span className="block text-sm font-semibold">Inscription libre</span>
                  <span className="text-xs text-ink-soft">
                    Les participants sont acceptés immédiatement (dans la limite des places). Sinon, vous validez chaque demande.
                  </span>
                </span>
              </label>
            </div>
          )}
          <div>
            <p className="etiquette">Compétences appréciées</p>
            <div className="flex flex-wrap gap-2">
              {competences?.map((c) => {
                const actif = comp.includes(c.id);
                return (
                  <button type="button" key={c.id} aria-pressed={actif} onClick={() => setComp(actif ? comp.filter((x) => x !== c.id) : [...comp, c.id])} className={`rounded-full border px-3 py-1.5 text-sm ${actif ? "border-corail bg-corail-soft font-semibold text-corail-dark" : "border-ligne bg-white text-ink-soft"}`}>
                    {c.nom}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="etiquette" htmlFor="img">Image (facultatif)</label>
            <input id="img" type="file" accept="image/*" className="text-sm" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </div>
        </fieldset>

        {erreur && <Alerte>{erreur}</Alerte>}
        <div className="flex justify-end gap-3">
          <Link href="/espace" className="btn-ghost">Annuler</Link>
          <button className="btn-primary" disabled={envoi}>{envoi ? "Enregistrement…" : id ? "Enregistrer" : estCitoyen ? "Publier l'activité" : "Publier l'annonce"}</button>
        </div>
      </form>
    </div>
  );
}
