import { PAYS } from "@/lib/pays";

/** Drapeau en SVG (les emojis drapeaux ne s'affichent pas sous Windows). Décoratif : le nom du pays est
 *  généralement écrit à côté ; sinon passer `libelle` pour l'annoncer aux lecteurs d'écran. */
export default function Drapeau({ code, libelle = false, className = "" }: { code?: string | null; libelle?: boolean; className?: string }) {
  const pays = code ? PAYS[code] : undefined;
  if (!pays) return <span aria-hidden>🌍</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code!.toLowerCase()}.svg`}
      alt={libelle ? pays.nom : ""}
      aria-hidden={libelle ? undefined : true}
      title={pays.nom}
      width={16}
      height={12}
      className={`inline-block h-[0.8em] w-auto shrink-0 rounded-[2px] align-[-0.05em] shadow-[0_0_0_1px_rgba(0,0,0,0.1)] ${className}`}
    />
  );
}
