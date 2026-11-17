import Link from "next/link";
import { Logo } from "./ui";

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white/80">
      <div className="conteneur grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo clair />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            SolidarLink relie les associations et les citoyens qui veulent agir près de chez eux : une heure, une journée ou
            toute l&apos;année.
          </p>
        </div>
        <div>
          <p className="mb-3 font-display font-bold text-white">Bénévoles</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-soleil" href="/missions">Trouver une mission</Link></li>
            <li><Link className="hover:text-soleil" href="/missions?type=DON">Faire un don</Link></li>
            <li><Link className="hover:text-soleil" href="/inscription">Créer mon profil</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display font-bold text-white">Associations</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-soleil" href="/inscription?type=ASSOCIATION">Inscrire mon association</Link></li>
            <li><Link className="hover:text-soleil" href="/associations">Annuaire</Link></li>
            <li><Link className="hover:text-soleil" href="/espace">Publier une annonce</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        SolidarLink · Projet de fin d&apos;études · Fait avec ❤️ pour l&apos;engagement citoyen
      </div>
    </footer>
  );
}
