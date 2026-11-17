"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormAssociation, FormCitoyen } from "@/components/FormProfil";
import { Alerte, Chargement } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Role = "CITOYEN" | "ASSOCIATION";

export default function InscriptionPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { me, chargement, recharger, definirTokens } = useAuth();
  const suivant = params.get("suivant");
  const [role, setRole] = useState<Role>(params.get("type") === "ASSOCIATION" ? "ASSOCIATION" : "CITOYEN");
  const [f, setF] = useState({ username: "", email: "", password: "" });
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Un utilisateur déjà complet n'a rien à faire ici
  useEffect(() => {
    if (!chargement && me?.profil) router.replace("/espace");
  }, [chargement, me, router]);

  if (chargement) return <Chargement />;

  const etapeProfil = Boolean(me && !me.profil && me.user.type !== "ADMIN");

  const creerCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const d = await api<{ access: string; refresh: string }>("/signup/", { method: "POST", auth: false, body: { ...f, type: role } });
      definirTokens(d.access, d.refresh);
      await recharger();
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  const fin = async () => {
    await recharger();
    router.push(suivant?.startsWith("/") ? suivant : "/espace");
  };

  return (
    <div className="conteneur max-w-2xl py-14">
      <ol className="mb-8 flex items-center gap-3 text-sm font-semibold" aria-label="Étapes">
        <li className={`flex items-center gap-2 ${etapeProfil ? "text-ink-soft" : "text-ink"}`}>
          <span className={`grid h-7 w-7 place-items-center rounded-full ${etapeProfil ? "bg-foret text-white" : "bg-corail text-white"}`}>{etapeProfil ? "✓" : "1"}</span> Compte
        </li>
        <span className="h-px w-10 bg-ligne" />
        <li className={`flex items-center gap-2 ${etapeProfil ? "text-ink" : "text-ink-soft"}`}>
          <span className={`grid h-7 w-7 place-items-center rounded-full ${etapeProfil ? "bg-corail text-white" : "bg-sable"}`}>2</span> Profil
        </li>
      </ol>

      {!etapeProfil ? (
        <div className="apparition">
          <h1 className="text-4xl font-extrabold">Rejoignez le mouvement</h1>
          <p className="mt-2 text-ink-soft">Vous souhaitez…</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup">
            {([
              ["CITOYEN", "🙋", "Aider en tant que bénévole", "Postuler, faire des dons, valoriser mes heures"],
              ["ASSOCIATION", "🏛️", "Inscrire mon association", "Publier des missions et gérer mes bénévoles"],
            ] as const).map(([r, e, t, d]) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => setRole(r)}
                className={`carte flex flex-col items-start gap-1 p-5 text-left transition ${role === r ? "border-corail ring-4 ring-corail/15" : "hover:border-ink"}`}
              >
                <span className="text-3xl">{e}</span>
                <span className="font-display text-lg font-bold">{t}</span>
                <span className="text-sm text-ink-soft">{d}</span>
              </button>
            ))}
          </div>

          <form onSubmit={creerCompte} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="etiquette" htmlFor="u">Nom d&apos;utilisateur</label>
                <input id="u" className="champ" required autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
              </div>
              <div>
                <label className="etiquette" htmlFor="m">Email</label>
                <input id="m" type="email" className="champ" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="etiquette" htmlFor="p">Mot de passe</label>
              <input id="p" type="password" className="champ" required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
              <p className="mt-1 text-xs text-ink-soft">8 caractères minimum, pas uniquement des chiffres.</p>
            </div>
            {erreur && <Alerte>{erreur}</Alerte>}
            <button className="btn-primary w-full" disabled={envoi}>{envoi ? "Création…" : "Continuer"}</button>
          </form>
          <p className="mt-6 text-sm text-ink-soft">
            Déjà inscrit·e ? <Link href="/connexion" className="font-semibold text-corail hover:underline">Connexion</Link>
          </p>
        </div>
      ) : (
        <div className="apparition">
          <h1 className="text-3xl font-extrabold">{me!.user.type === "ASSOCIATION" ? "Présentez votre association" : "Parlez-nous de vous"}</h1>
          <p className="mb-8 mt-2 text-ink-soft">Ces informations nous aident à vous proposer les bonnes missions.</p>
          {me!.user.type === "ASSOCIATION" ? <FormAssociation creation onOk={fin} /> : <FormCitoyen creation onOk={fin} />}
        </div>
      )}
    </div>
  );
}
