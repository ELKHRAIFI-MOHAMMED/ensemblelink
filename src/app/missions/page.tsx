import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/ui";
import MissionsClient from "./missions-client";

export const metadata: Metadata = { title: "Trouver une mission" };

export default function MissionsPage() {
  return (
    <div className="conteneur py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-corail">Missions</p>
      <h1 className="mt-1 text-4xl font-extrabold md:text-5xl">Trouvez votre façon d&apos;aider</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Bénévolat ponctuel, évènements solidaires ou collectes de dons : toutes les annonces sont publiées par des associations
        vérifiées.
      </p>
      <Suspense fallback={<Chargement />}>
        <MissionsClient />
      </Suspense>
    </div>
  );
}
