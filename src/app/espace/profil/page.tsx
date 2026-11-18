"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormAssociation, FormCitoyen } from "@/components/FormProfil";
import { Chargement, useToast } from "@/components/ui";
import { profilAssociation, profilCitoyen, useAuth } from "@/lib/auth";

export default function ProfilPage() {
  const { me, chargement, recharger } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!chargement && (!me || !me.profil)) router.replace("/espace");
  }, [chargement, me, router]);

  if (chargement || !me?.profil) return <Chargement />;

  const ok = async () => {
    await recharger();
    toast("Profil mis à jour");
    router.push("/espace");
  };

  return (
    <div className="max-w-2xl">
      <Link href="/espace" className="text-sm font-semibold text-ink-soft hover:text-ink">← Mon espace</Link>
      <h1 className="mb-8 mt-3 text-4xl font-extrabold">Mon profil</h1>
      <div className="carte p-6">
        {me.user.type === "ASSOCIATION" ? (
          <FormAssociation initial={profilAssociation(me)} onOk={ok} creation={false} />
        ) : (
          <FormCitoyen initial={profilCitoyen(me)} onOk={ok} creation={false} />
        )}
      </div>
    </div>
  );
}
