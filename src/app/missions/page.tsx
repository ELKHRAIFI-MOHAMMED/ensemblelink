import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/ui";
import MissionsClient from "./missions-client";

export const metadata: Metadata = { title: "Missions et activités" };

export default function MissionsPage() {
  return (
    <div className="conteneur py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-corail">Missions & activités</p>
      <h1 className="mt-1 text-4xl font-extrabold md:text-5xl">Aider, partager, se retrouver</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Bénévolat, évènements solidaires et collectes publiés par des associations vérifiées, et activités proposées par
        les citoyens eux-mêmes : match de foot, club de lecture, pique-nique… au Maroc, en France, au Royaume-Uni, aux
        États-Unis, au Canada et ailleurs.
      </p>
      <Suspense fallback={<Chargement />}>
        <MissionsClient />
      </Suspense>
    </div>
  );
}
