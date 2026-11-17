"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokens } from "./api";
import type { Association, Citoyen, Me, StatsAssociation, StatsCitoyen, User } from "./types";

interface AuthState {
  me: Me | null;
  user: User | null;
  chargement: boolean;
  connexion: (identifiant: string, motDePasse: string) => Promise<Me>;
  deconnexion: () => void;
  recharger: () => Promise<Me | null>;
  definirTokens: (access: string, refresh: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    if (!tokens.access) {
      setMe(null);
      setChargement(false);
      return null;
    }
    try {
      const data = await api<Me>("/me/");
      setMe(data);
      return data;
    } catch {
      tokens.clear();
      setMe(null);
      return null;
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    // Lecture du token stocké : uniquement côté navigateur, après l'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recharger();
  }, [recharger]);

  const connexion = useCallback(
    async (identifiant: string, motDePasse: string) => {
      const d = await api<{ access: string; refresh: string }>("/login/", {
        method: "POST",
        auth: false,
        body: { username_email: identifiant, password: motDePasse },
      });
      tokens.set(d.access, d.refresh);
      const data = await recharger();
      if (!data) throw new Error("Impossible de charger le profil.");
      return data;
    },
    [recharger],
  );

  const deconnexion = useCallback(() => {
    tokens.clear();
    setMe(null);
  }, []);

  const definirTokens = useCallback((access: string, refresh: string) => tokens.set(access, refresh), []);

  const value = useMemo(
    () => ({ me, user: me?.user ?? null, chargement, connexion, deconnexion, recharger, definirTokens }),
    [me, chargement, connexion, deconnexion, recharger, definirTokens],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}

/* Accesseurs typés selon le rôle */
export const profilCitoyen = (me: Me | null) => (me?.user.type === "CITOYEN" ? (me.profil as Citoyen | null) : null);
export const profilAssociation = (me: Me | null) =>
  me?.user.type === "ASSOCIATION" ? (me.profil as Association | null) : null;
export const statsCitoyen = (me: Me | null) => (me?.user.type === "CITOYEN" ? (me.stats as StatsCitoyen | null) : null);
export const statsAssociation = (me: Me | null) =>
  me?.user.type === "ASSOCIATION" ? (me.stats as StatsAssociation | null) : null;
