import Link from "next/link";
import { BandeauPays, Categories, MissionsUne, RechercheHero, StatsLive } from "./accueil-client";
import Drapeau from "@/components/Drapeau";

export default function Accueil() {
  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <section className="relative overflow-hidden">
        <div className="motif-points absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-corail-soft blur-3xl" aria-hidden />
        <div className="absolute -bottom-52 -left-32 h-[420px] w-[420px] rounded-full bg-soleil-soft blur-3xl" aria-hidden />

        <div className="conteneur relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="apparition">
            <span className="pastille bg-white text-foret shadow-carte">
              <span className="h-2 w-2 rounded-full bg-foret" />
              {["MA", "FR", "GB", "US", "CA"].map((c) => <Drapeau key={c} code={c} />)}
              Une communauté dans le monde entier
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] md:text-7xl">
              Un peu de temps,
              <br />
              <span className="surligne">beaucoup</span> d&apos;impact.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Aider une association, ou organiser un match de foot, un club de lecture, un pique-nique avec vos voisins :
              trouvez votre façon de vous engager et de rencontrer du monde, en deux clics.
            </p>
            <RechercheHero />
            <p className="mt-4 text-sm text-ink-soft">
              Populaire :{" "}
              {[
                ["Activités entre citoyens", "/missions?type=ACTIVITE"],
                ["Aide alimentaire", "/missions?search=repas"],
                ["Collectes de dons", "/missions?type=DON"],
              ].map(([lib, href], i) => (
                <span key={href}>
                  {i > 0 && " · "}
                  <Link href={href} className="font-semibold text-ink underline decoration-corail decoration-2 underline-offset-4 hover:text-corail">
                    {lib}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          {/* Collage illustratif */}
          <div className="relative mx-auto hidden h-[460px] w-full max-w-md lg:block" aria-hidden>
            <div className="carte absolute left-6 top-4 w-72 rotate-[-4deg] p-5">
              <span className="pastille bg-foret-soft text-foret">Bénévolat</span>
              <p className="mt-3 font-display text-lg font-bold">Cuisine solidaire du samedi</p>
              <p className="mt-1 text-sm text-ink-soft">📍 Lyon · 🗓️ sam. 9h – 13h</p>
              <div className="mt-4 flex -space-x-2">
                {["#F26B3A", "#1F5A43", "#3D6FD8", "#C2477A"].map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-sable text-xs font-bold">+3</span>
              </div>
            </div>
            <div className="carte absolute right-0 top-40 w-60 rotate-[5deg] p-5">
              <p className="text-sm text-ink-soft">Collecte de couvertures</p>
              <div className="mt-3 h-2.5 rounded-full bg-sable">
                <div className="h-full w-3/4 rounded-full bg-soleil" />
              </div>
              <p className="mt-2 text-xs"><strong>90</strong> / 120 couvertures 🎁</p>
            </div>
            <div className="absolute bottom-10 left-0 w-64 rotate-[-2deg] rounded-xl2 bg-ink p-5 text-white shadow-carte-hover">
              <p className="text-xs uppercase tracking-widest text-white/50">Votre impact</p>
              <p className="mt-1 font-display text-4xl font-extrabold text-soleil">27 h</p>
              <p className="text-sm text-white/70">de bénévolat validées</p>
              <p className="mt-3 text-2xl">🌱 🤝 ⏱️ 💝</p>
            </div>
            <span className="absolute right-10 top-0 text-6xl">🧡</span>
            <span className="absolute bottom-0 right-8 text-6xl">🌿</span>
          </div>
        </div>
      </section>

      <StatsLive />

      {/* ------------------------------------------------------------ CATÉGORIES */}
      <section className="conteneur mt-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-corail">Explorer</p>
            <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">Quelle cause vous tient à cœur ?</h2>
          </div>
          <Link href="/missions" className="btn-ghost">Toutes les missions →</Link>
        </div>
        <Categories />
      </section>

      {/* ------------------------------------------------------------ MISSIONS À LA UNE */}
      <section className="conteneur mt-20">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-corail">Bientôt</p>
          <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">Les prochaines missions</h2>
        </div>
        <MissionsUne />
      </section>

      {/* ------------------------------------------------------------ ACTIVITÉS ENTRE CITOYENS */}
      <section className="conteneur mt-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-corail">Entre citoyens</p>
            <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">Foot, lecture, pique-nique… rejoignez le mouvement</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Chaque citoyen peut proposer une activité. Les participants sont réunis dans un groupe de discussion qui se ferme
              automatiquement à la fin.
            </p>
          </div>
          <Link href="/espace/annonce" className="btn-primary">+ Proposer une activité</Link>
        </div>
        <MissionsUne filtre="&type=ACTIVITE" />
      </section>

      {/* ------------------------------------------------------------ INTERNATIONAL */}
      <section className="conteneur mt-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-12 text-white md:px-14">
          <div className="motif-points absolute inset-0 opacity-10" aria-hidden />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-soleil">Partout dans le monde</p>
              <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">De Casablanca à Vancouver</h2>
              <p className="mt-3 max-w-lg text-white/70">
                Associations et citoyens au Maroc, en France, au Royaume-Uni, aux États-Unis et au Canada. Chaque activité
                s&apos;affiche à l&apos;heure locale de son pays.
              </p>
            </div>
            <BandeauPays />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ COMMENT ÇA MARCHE */}
      <section id="comment" className="mt-24 scroll-mt-20 bg-foret py-20 text-white">
        <div className="conteneur">
          <p className="text-sm font-bold uppercase tracking-widest text-soleil">Comment ça marche</p>
          <h2 className="mt-1 max-w-2xl text-3xl font-extrabold md:text-4xl">De l&apos;envie d&apos;aider à l&apos;action, en trois étapes.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["1", "Je trouve ma mission", "Filtrez par cause, ville ou compétence, ou laissez-nous vous recommander des missions qui vous correspondent."],
              ["2", "Je participe en un clic", "Inscription immédiate ou validée par l'organisateur. Vous rejoignez automatiquement le groupe de discussion de l'activité."],
              ["3", "Mon engagement est reconnu", "Le jour J, l'association scanne votre QR code : vos heures sont validées, vous gagnez des badges et une attestation PDF."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-xl2 border border-white/10 bg-white/5 p-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-soleil font-display text-xl font-extrabold text-ink">{n}</span>
                <h3 className="mt-5 text-xl font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ RECONNAISSANCE */}
      <section className="conteneur mt-24 grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-corail">Valoriser l&apos;engagement</p>
          <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">Chaque heure donnée compte, et se voit.</h2>
          <ul className="mt-8 space-y-5">
            {[
              ["⏱️", "Heures validées", "Comptabilisées automatiquement grâce au pointage par QR code."],
              ["📄", "Attestation de bénévolat", "Un PDF officiel à joindre à votre CV ou à votre dossier d'études."],
              ["⭐", "Avis réciproques", "Bénévoles et associations s'évaluent après chaque mission pour bâtir la confiance."],
              ["🏅", "Badges", "Premier pas, Cœur généreux, Pilier solidaire… suivez votre progression."],
            ].map(([e, t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-carte">{e}</span>
                <span>
                  <span className="block font-display text-lg font-bold">{t}</span>
                  <span className="text-sm text-ink-soft">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="carte rotate-[1.5deg] p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Attestation de bénévolat</p>
            <p className="mt-4 font-display text-2xl font-extrabold">Emma Martin</p>
            <p className="mt-1 text-sm text-ink-soft">a participé à « Distribution de colis alimentaires »</p>
            <div className="my-6 h-px bg-ligne" />
            <div className="grid grid-cols-3 gap-4 text-center">
              {[["4 h", "validées"], ["5/5", "engagement"], ["🌱", "Premier pas"]].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl font-extrabold text-corail">{v}</p>
                  <p className="text-xs text-ink-soft">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -left-4 -z-10 h-full w-full rounded-xl2 bg-soleil" />
        </div>
      </section>

      {/* ------------------------------------------------------------ CTA ASSOCIATIONS */}
      <section className="conteneur mt-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-corail px-8 py-14 text-white md:px-14">
          <div className="motif-points absolute inset-0 opacity-20" aria-hidden />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold md:text-4xl">Vous êtes une association ?</h2>
              <p className="mt-3 max-w-lg text-white/85">
                Publiez vos missions, recevez des candidatures qualifiées, gérez vos bénévoles et suivez votre impact. Gratuit,
                après une rapide vérification de votre structure.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/inscription?type=ASSOCIATION" className="btn bg-white text-corail hover:bg-creme">Inscrire mon association</Link>
              <Link href="/associations" className="btn border border-white/50 text-white hover:bg-white/10">Voir l&apos;annuaire</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
