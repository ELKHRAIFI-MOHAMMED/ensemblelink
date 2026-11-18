"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, TEMPS_REEL, wsUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ilya } from "@/lib/format";
import type { Notification, Paginated } from "@/lib/types";
import { Avatar, Logo, useToast } from "./ui";

const LIENS = [
  { href: "/missions", libelle: "Missions" },
  { href: "/missions?type=ACTIVITE", libelle: "Activités" },
  { href: "/associations", libelle: "Associations" },
  { href: "/#comment", libelle: "Comment ça marche" },
];

export default function Header() {
  const { me, chargement, deconnexion } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);

  const nom =
    me?.profil && "prenom" in me.profil
      ? `${me.profil.prenom} ${me.profil.nom}`
      : me?.profil && "nom" in me.profil
        ? me.profil.nom
        : (me?.user.username ?? "");
  const avatar = me?.profil ? ("photo" in me.profil ? me.profil.photo : "logo" in me.profil ? me.profil.logo : null) : null;

  return (
    <header className="sticky top-0 z-[900] border-b border-ligne/70 bg-creme/85 backdrop-blur-md">
      <div className="conteneur flex h-16 items-center gap-3 sm:gap-6">
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

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {chargement ? (
            <span className="h-9 w-20 animate-pulse rounded-full bg-sable sm:w-24" />
          ) : me ? (
            <>
              <Link href="/messages" className="relative hidden rounded-full p-2 text-ink-soft hover:bg-sable sm:block" aria-label="Messages">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
                </svg>
              </Link>
              <Cloche />
              <div className="relative">
                <button
                  onClick={() => setMenu((m) => !m)}
                  className="flex items-center gap-2 rounded-full border border-ligne bg-white p-1 hover:border-ink sm:pr-3"
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
                      ...(me.user.type !== "ADMIN"
                        ? [
                            ["/espace/historique", "Mon historique"],
                            ["/espace/profil", "Modifier mon profil"],
                          ]
                        : []),
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
              <Link href="/inscription" className="btn-primary btn-sm max-sm:hidden sm:px-5 sm:py-2.5 sm:text-sm">
                Devenir bénévole
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobile((m) => !m)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-sable md:hidden"
            aria-label={mobile ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobile}
            aria-controls="menu-mobile"
            data-menu-mobile
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {mobile ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile (< md) : navigation + accès au compte */}
      {mobile && (
        <nav id="menu-mobile" className="apparition border-t border-ligne/70 bg-creme md:hidden" aria-label="Navigation mobile">
          <div className="conteneur grid gap-1 py-3">
            {[...LIENS, ...(me ? [{ href: "/espace", libelle: "Mon espace" }, { href: "/messages", libelle: "Messagerie" }] : [])].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobile(false)}
                className={`rounded-xl px-4 py-3 text-base font-medium hover:bg-sable ${pathname === l.href ? "bg-sable text-ink" : "text-ink-soft"}`}
              >
                {l.libelle}
              </Link>
            ))}
            {!me && !chargement && (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ligne/70 pt-3">
                <Link href="/connexion" onClick={() => setMobile(false)} className="btn-ghost">
                  Connexion
                </Link>
                <Link href="/inscription" onClick={() => setMobile(false)} className="btn-primary">
                  Devenir bénévole
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
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
  const derniere = useRef<number | null>(null);

  const charger = useCallback(async () => {
    try {
      const d = await api<Paginated<Notification> & { non_lues: number }>("/notifications/?page_size=8");
      // Mode rafraîchissement : afficher un toast pour les nouvelles notifications
      const plusRecente = d.results[0];
      if (plusRecente && derniere.current !== null && plusRecente.id > derniere.current && !plusRecente.lue) {
        toast(plusRecente.titre, "info");
      }
      derniere.current = Math.max(plusRecente?.id ?? 0, derniere.current ?? 0);
      setNotifs(d.results);
      setNonLues(d.non_lues);
    } catch {
      /* silencieux */
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    if (!TEMPS_REEL) {
      const t = setInterval(charger, 30_000);
      return () => clearInterval(t);
    }
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
        <div
          className="carte apparition fixed inset-x-3 top-16 overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80"
          onMouseLeave={() => setOuvert(false)}
        >
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
