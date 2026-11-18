"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Bandeau de la version bêta (démo investisseurs) : données fictives + accès rapide aux comptes de test.
 *  Le premier rendu est identique côté serveur et navigateur (bandeau affiché) ; s'il a été masqué
 *  pendant la session, il disparaît juste après l'hydratation. */
export default function BandeauBeta() {
  const [masque, setMasque] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("el_bandeau_beta") === "masque") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMasque(true);
    }
  }, []);

  return (
    <div hidden={masque} className="relative z-[950] bg-ink px-10 py-2 text-center text-xs text-white sm:text-sm">
      <span className="mr-1" aria-hidden>
        🧪
      </span>
      <strong>EnsembleLink bêta</strong> : démo avec des données fictives (Maroc, France, Royaume-Uni, États-Unis, Canada).{" "}
      <Link href="/connexion" className="font-semibold text-soleil underline underline-offset-2 hover:text-white">
        Tester avec un compte de démo →
      </Link>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem("el_bandeau_beta", "masque");
          setMasque(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 text-white/60 hover:text-white"
        aria-label="Masquer le bandeau"
      >
        ✕
      </button>
    </div>
  );
}
