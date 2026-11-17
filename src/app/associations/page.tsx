import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/ui";
import AssociationsClient from "./associations-client";

export const metadata: Metadata = { title: "Associations" };

export default function AssociationsPage() {
  return (
    <div className="conteneur py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-corail">Annuaire</p>
      <h1 className="mt-1 text-4xl font-extrabold md:text-5xl">Les associations engagées</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Chaque structure est vérifiée par notre équipe avant de pouvoir publier. Les notes viennent des bénévoles qui ont
        participé à leurs missions.
      </p>
      <Suspense fallback={<Chargement />}>
        <AssociationsClient />
      </Suspense>
    </div>
  );
}
