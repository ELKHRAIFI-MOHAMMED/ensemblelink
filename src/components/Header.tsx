"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, wsUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ilya } from "@/lib/format";
import type { Notification, Paginated } from "@/lib/types";
import { Avatar, Logo, useToast } from "./ui";

const LIENS = [
  { href: "/missions", libelle: "Trouver une mission" },
  { href: "/associations", libelle: "Associations" },
  { href: "/#comment", libelle: "Comment ça marche" },
];

export default function Header() {
  const { me, chargement, deconnexion } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  const nom =
    me?.profil && "prenom" in me.profil
      ? `${me.profil.prenom} ${me.profil.nom}`
      : me?.profil && "nom" in me.profil
        ? me.profil.nom
        : (me?.user.username ?? "");
  const avatar = me?.profil ? ("photo" in me.profil ? me.profil.photo : "logo" in me.profil ? me.profil.logo : null) : null;

  return (
    <header className="sticky top-0 z-[900] border-b border-ligne/70 bg-creme/85 backdrop-blur-md">
      <div className="conteneur flex h-16 items-center gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition hover:bg-sable ${
                pathname === l.href ? "bg-sable text-ink" : "text-ink-soft"
              }`}
            >
              {l.libelle}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {chargement ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-sable" />
          ) : me ? (
            <>
              <Link href="/messages" className="relative rounded-full p-2 text-ink-soft hover:bg-sable" aria-label="Messages">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
                </svg>
              </Link>
              <Cloche />
              <div className="relative">
                <button
                  onClick={() => setMenu((m) => !m)}
                  className="flex items-center gap-2 rounded-full border border-ligne bg-white py-1 pl-1 pr-3 hover:border-ink"
                  aria-expanded={menu}
                  aria-haspopup="menu"
                >
                  <Avatar nom={nom} src={avatar} taille={30} />
                  <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{nom}</span>
                </button>
                {menu && (
                  <div role="menu" className="carte apparition absolute right-0 mt-2 w-56 overflow-hidden p-1.5" onMouseLeave={() => setMenu(false)}>
                    <p className="px-3 py-2 text-xs text-ink-soft">
                      Connecté·e en tant que <strong className="text-ink">{me.user.type.toLowerCase()}</strong>
                    </p>
                    {[
                      ["/espace", "Mon espace"],
                      ...(me.user.type !== "ADMIN" ? [["/espace/profil", "Modifier mon profil"]] : []),
                      ["/messages", "Messagerie"],
                    ].map(([href, lib]) => (
                      <Link key={href} href={href} onClick={() => setMenu(false)} role="menuitem" className="block rounded-lg px-3 py-2 text-sm hover:bg-sable">
                        {lib}
                      </Link>
                    ))}
                    <button
                      role="menuitem"
                      onClick={() => {
                        deconnexion();
                        setMenu(false);
                        router.push("/");
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#a32626] hover:bg-[#fff1f1]"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn-ghost btn-sm sm:px-5 sm:py-2.5 sm:text-sm">
                Connexion
              </Link>
              <Link href="/inscription" className="btn-primary btn-sm sm:px-5 sm:py-2.5 sm:text-sm">
                Devenir bénévole
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="conteneur flex gap-1 overflow-x-auto pb-2 md:hidden" aria-label="Navigation mobile">
        {LIENS.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-soft">
            {l.libelle}
          </Link>
        ))}
      </nav>
    </header>
  );
}

/** Cloche de notifications : WebSocket temps réel + liste déroulante. */
function Cloche() {
  const [ouvert, setOuvert] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const toast = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  const charger = useCallback(async () => {
    try {
      const d = await api<Paginated<Notification> & { non_lues: number }>("/notifications/?page_size=8");
      setNotifs(d.results);
      setNonLues(d.non_lues);
    } catch {
      /* silencieux */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    let ferme = false;
    let essai = 0;
    const connecter = () => {
      const ws = new WebSocket(wsUrl("/ws/notifications/"));
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type === "notification") {
          setNotifs((n) => [d.notification, ...n].slice(0, 8));
          setNonLues((n) => n + 1);
          toast(d.notification.titre, "info");
        }
      };
      ws.onopen = () => (essai = 0);
      ws.onclose = () => {
        if (!ferme && essai < 5) setTimeout(connecter, 2000 * ++essai);
      };
    };
    connecter();
    return () => {
      ferme = true;
      wsRef.current?.close();
    };
  }, [charger, toast]);

  const toutLire = async () => {
    await api("/notifications/tout-lire/", { method: "POST" });
    setNonLues(0);
    setNotifs((n) => n.map((x) => ({ ...x, lue: true })));
  };

  return (
    <div className="relative">
      <button onClick={() => setOuvert((o) => !o)} className="relative rounded-full p-2 text-ink-soft hover:bg-sable" aria-label={`Notifications (${nonLues} non lues)`} aria-expanded={ouvert}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {nonLues > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-corail px-1 text-[10px] font-bold text-white">
            {nonLues > 9 ? "9+" : nonLues}
          </span>
        )}
      </button>
      {ouvert && (
        <div className="carte apparition absolute right-0 mt-2 w-80 overflow-hidden" onMouseLeave={() => setOuvert(false)}>
          <div className="flex items-center justify-between border-b border-ligne px-4 py-3">
            <p className="font-display font-bold">Notifications</p>
            {nonLues > 0 && (
              <button onClick={toutLire} className="text-xs font-semibold text-corail hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifs.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-soft">Rien de neuf pour le moment.</li>}
            {notifs.map((n) => (
              <li key={n.id}>
                <Link href={n.lien || "/espace"} onClick={() => setOuvert(false)} className={`flex gap-3 px-4 py-3 hover:bg-creme ${n.lue ? "" : "bg-corail-soft/40"}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lue ? "bg-transparent" : "bg-corail"}`} />
                  <span>
                    <span className="block text-sm font-semibold">{n.titre}</span>
                    {n.message && <span className="block text-xs text-ink-soft">{n.message}</span>}
                    <span className="mt-0.5 block text-[11px] text-ink-soft/70">{ilya(n.date_creation)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
