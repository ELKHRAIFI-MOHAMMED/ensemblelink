import { Suspense } from "react";
import { Chargement } from "@/components/ui";
import MissionDetail from "./mission-detail";

export default function MissionPage() {
  return (
    <Suspense fallback={<Chargement />}>
      <MissionDetail />
    </Suspense>
  );
}
