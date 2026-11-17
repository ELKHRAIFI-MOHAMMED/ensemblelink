"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/** Charge une ressource de l'API ; `recharger()` relance la requête. */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(Boolean(path));
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    let annule = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChargement(true);
    api<T>(path)
      .then((d) => {
        if (!annule) {
          setData(d);
          setErreur(null);
        }
      })
      .catch((e: Error) => !annule && setErreur(e.message))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version, ...deps]);

  const recharger = useCallback(() => setVersion((v) => v + 1), []);
  return { data, erreur, chargement, recharger, setData };
}
