"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Chargement } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import EspaceAdmin from "./espace-admin";
import EspaceAssociation from "./espace-association";
import EspaceCitoyen from "./espace-citoyen";

export default function EspacePage() {
  const { me, chargement } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (chargement) return;
    if (!me) router.replace("/connexion?suivant=/espace");
    else if (!me.profil && me.user.type !== "ADMIN") router.replace("/inscription?etape=profil");
  }, [me, chargement, router]);

  if (chargement || !me || (!me.profil && me.user.type !== "ADMIN")) return <Chargement />;

  return (
    <div>
      {me.user.type === "ADMIN" ? <EspaceAdmin /> : me.user.type === "ASSOCIATION" ? <EspaceAssociation /> : <EspaceCitoyen />}
    </div>
  );
}
