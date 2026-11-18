"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { heure, TYPES_ANNONCE } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { EvenementJourJ } from "@/lib/types";
import Drapeau from "./Drapeau";
import { Modale } from "./ui";

/** « C'est le jour J ! » — bandeau très visible (et fenêtre une fois par jour) quand l'utilisateur a une
 *  activité ou une mission aujourd'hui, ou en cours. */
export default function AlerteJourJ() {
  const { me } = useAuth();
  const { data } = useApi<{ evenements: EvenementJourJ[] }>(me && me.user.type !== "ADMIN" ? "/aujourdhui/" : null, [me?.user.id]);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [qr, setQr] = useState<EvenementJourJ | null>(null);
  const [popup, setPopup] = useState(false);
  const evenements = useMemo(() => data?.evenements ?? [], [data]);

  // Compte à rebours rafraîchi toutes les 30 s
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Fenêtre d'alerte affichée une seule fois par jour (et par liste d'activités)
  useEffect(() => {
    if (!evenements.length || !me) return;
    const cle = `sl_jourj_${me.user.id}_${new Date().toDateString()}_${evenements.map((e) => e.annonce.id).join("-")}`;
    if (localStorage.getItem(cle)) return;
    localStorage.setItem(cle, "1");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPopup(true);
  }, [evenements, me]);

  if (!evenements.length) return null;

  return (
    <>
      <section
        role="alert"
        aria-live="polite"
        className="relative mb-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-corail via-[#f4823f] to-[#f7a541] p-1 shadow-carte-hover"
      >
        <div className="rounded-[1.5rem] bg-white/95 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-corail text-2xl text-white shadow-carte motion-safe:animate-bounce">📅</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-corail">C&apos;est le jour J</p>
              <h2 className="font-display text-2xl font-extrabold leading-tight">
                {evenements.length > 1 ? `Vous avez ${evenements.length} rendez-vous aujourd'hui !` : "Vous avez rendez-vous aujourd'hui !"}
              </h2>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {evenements.map((e) => (
              <Carte key={e.annonce.id} e={e} maintenant={maintenant} onQr={() => setQr(e)} />
            ))}
          </ul>
        </div>
      </section>

      {/* Fenêtre d'alerte (première visite du jour) */}
      <Modale ouverte={popup} onFermer={() => setPopup(false)} titre="📅 C'est aujourd'hui !">
        <div className="space-y-3">
          {evenements.map((e) => (
            <div key={e.annonce.id} className="rounded-2xl bg-corail-soft/50 p-4">
              <p className="font-display text-lg font-bold">{e.annonce.titre}</p>
              <p className="text-sm text-ink-soft">
                {!e.en_cours && `À ${heure(e.annonce.date_debut, e.annonce.fuseau_horaire)} · `}
                <Drapeau code={e.annonce.pays} libelle />{" "}
                {e.annonce.ville} · {compteARebours(e, maintenant)}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {e.role === "ORGANISATEUR"
                  ? `Vous organisez · ${e.participants} participant${e.participants > 1 ? "s" : ""} inscrit${e.participants > 1 ? "s" : ""}`
                  : e.code_presence
                    ? "N'oubliez pas de montrer votre QR de présence à l'arrivée."
                    : "Bonne activité !"}
              </p>
            </div>
          ))}
          <button className="btn-primary w-full" onClick={() => setPopup(false)}>C&apos;est noté !</button>
        </div>
      </Modale>

      <Modale ouverte={Boolean(qr)} onFermer={() => setQr(null)} titre="Mon QR de présence">
        {qr?.code_presence && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-ink-soft">Présentez ce code à l&apos;organisateur de « {qr.annonce.titre} ».</p>
            <div className="rounded-2xl border border-ligne bg-white p-4">
              <QRCodeSVG value={qr.code_presence} size={220} fgColor="#1d2a23" />
            </div>
            <code className="break-all rounded-lg bg-sable px-3 py-1.5 text-xs">{qr.code_presence}</code>
          </div>
        )}
      </Modale>
    </>
  );
}

function compteARebours(e: EvenementJourJ, maintenant: number) {
  const debut = new Date(e.annonce.date_debut).getTime();
  const fin = new Date(e.annonce.date_fin).getTime();
  const fmt = (ms: number) => {
    const min = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
  };
  if (maintenant < debut) return `commence dans ${fmt(debut - maintenant)}`;
  if (maintenant < fin) return `en cours · se termine dans ${fmt(fin - maintenant)}`;
  return "terminé";
}

function Carte({ e, maintenant, onQr }: { e: EvenementJourJ; maintenant: number; onQr: () => void }) {
  const a = e.annonce;
  const tz = a.fuseau_horaire;
  const enCours = maintenant >= new Date(a.date_debut).getTime();
  const itineraire =
    e.latitude && e.longitude
      ? `https://www.openstreetmap.org/directions?to=${e.latitude}%2C${e.longitude}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${e.lieu} ${a.ville}`)}`;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-ligne bg-creme/60 p-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-4 lg:w-44 lg:flex-col lg:items-start lg:gap-1">
        <p className="font-display text-4xl font-extrabold text-corail">{heure(a.date_debut, tz)}</p>
        <span className={`pastille ${enCours ? "bg-foret text-white" : "bg-soleil-soft text-[#8a5a00]"}`}>
          {enCours && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
          {compteARebours(e, maintenant)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`pastille ${TYPES_ANNONCE[a.type].classe}`}>{TYPES_ANNONCE[a.type].libelle}</span>
          {e.role === "ORGANISATEUR" && <span className="pastille bg-ink text-white">Vous organisez</span>}
          {e.presence_confirmee && <span className="pastille bg-foret-soft text-foret">✓ Présence confirmée</span>}
        </div>
        <Link href={`/missions/${a.id}`} className="mt-1 block font-display text-xl font-bold hover:text-corail">
          {e.icone} {a.titre}
        </Link>
        <p className="text-sm text-ink-soft">
          <Drapeau code={a.pays} libelle /> {e.lieu} · {heure(a.date_debut, tz)} – {heure(a.date_fin, tz)}
          {e.role === "PARTICIPANT" ? ` · organisé par ${a.organisateur.nom}` : ` · ${e.participants}${e.places ? ` / ${e.places}` : ""} participants`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {e.code_presence && <button className="btn-secondary btn-sm" onClick={onQr}>📱 Mon QR de présence</button>}
        {e.role === "ORGANISATEUR" && a.association && <Link href="/espace" className="btn-secondary btn-sm">📱 Pointer les présences</Link>}
        {e.groupe && <Link href={`/messages?groupe=${e.groupe.id}`} className="btn-ghost btn-sm">💬 Groupe</Link>}
        <a href={itineraire} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">🧭 Itinéraire</a>
      </div>
    </li>
  );
}
