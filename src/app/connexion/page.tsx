"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alerte } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import Drapeau from "@/components/Drapeau";

const DEMO = [
  { libelle: "Bénévole · France", ident: "emma.martin", emoji: "🙋", pays: "FR" },
  { libelle: "Citoyen organisateur · Maroc", ident: "yassine.elamrani", emoji: "⚽", pays: "MA" },
  { libelle: "Citizen · United Kingdom", ident: "oliver.smith", emoji: "📖", pays: "GB" },
  { libelle: "Association", ident: "panier_solidaire", emoji: "🏛️" },
  { libelle: "Admin", ident: "admin", emoji: "🛡️" },
];

export default function ConnexionPage() {
  const { connexion } = useAuth();
  const router = useRouter();
  const suivant = useSearchParams().get("suivant");
  const [ident, setIdent] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (i = ident, m = mdp) => {
    setEnvoi(true);
    setErreur(null);
    try {
      const me = await connexion(i, m);
      router.push(suivant?.startsWith("/") ? suivant : me.profil ? "/espace" : "/inscription?etape=profil");
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="conteneur grid max-w-5xl gap-10 py-14 md:grid-cols-2">
      <div className="apparition">
        <h1 className="text-4xl font-extrabold">Bon retour parmi nous 👋</h1>
        <p className="mt-2 text-ink-soft">Connectez-vous avec votre email ou votre nom d&apos;utilisateur.</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            soumettre();
          }}
        >
          <div>
            <label htmlFor="ident" className="etiquette">Email ou nom d&apos;utilisateur</label>
            <input id="ident" className="champ" autoComplete="username" required value={ident} onChange={(e) => setIdent(e.target.value)} />
          </div>
          <div>
            <label htmlFor="mdp" className="etiquette">Mot de passe</label>
            <input id="mdp" type="password" className="champ" autoComplete="current-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} />
          </div>
          {erreur && <Alerte>{erreur}</Alerte>}
          <button className="btn-primary w-full" disabled={envoi}>{envoi ? "Connexion…" : "Se connecter"}</button>
        </form>
        <p className="mt-6 text-sm text-ink-soft">
          Pas encore de compte ? <Link href="/inscription" className="font-semibold text-corail hover:underline">Inscrivez-vous</Link>
        </p>
      </div>

      <div className="carte h-fit bg-ink p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-soleil">Mode démo</p>
        <h2 className="mt-2 text-2xl font-bold">Testez chaque rôle en un clic</h2>
        <p className="mt-2 text-sm text-white/70">Mot de passe commun : <code className="rounded bg-white/10 px-1.5 py-0.5">Demo1234!</code></p>
        <div className="mt-6 grid gap-3">
          {DEMO.map((d) => (
            <button
              key={d.ident}
              disabled={envoi}
              onClick={() => {
                setIdent(d.ident);
                setMdp("Demo1234!");
                soumettre(d.ident, "Demo1234!");
              }}
              className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <span className="text-2xl">{d.emoji}</span>
              <span>
                <span className="flex items-center gap-2 font-semibold">{d.libelle} {d.pays && <Drapeau code={d.pays} libelle />}</span>
                <span className="text-xs text-white/60">{d.ident}</span>
              </span>
              <span className="ml-auto text-soleil">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
