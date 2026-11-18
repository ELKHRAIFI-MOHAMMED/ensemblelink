import { Suspense } from "react";
import AlerteJourJ from "@/components/AlerteJourJ";
import EspaceSidebar from "@/components/EspaceSidebar";

/** « Mon espace » : barre latérale (historique, activités créées, engagements…) + contenu de la page. */
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <Suspense fallback={<div className="hidden lg:block" />}>
        <EspaceSidebar />
      </Suspense>
      <div className="min-w-0">
        {/* Le jour d'une activité ou d'une mission : alerte bien visible en haut de l'espace */}
        <AlerteJourJ />
        {children}
      </div>
    </div>
  );
}
