# EnsembleLink — Frontend (v4 bêta)

Application Next.js 16 (App Router, TypeScript, Tailwind CSS v4) d'**EnsembleLink** : bénévolat, collectes de dons et
activités entre citoyens (sport, lecture, sorties…), au Maroc, en France, au Royaume-Uni, aux États-Unis et au Canada.

API : dépôt [backPfe](https://github.com/ELKHRAIFI-MOHAMMED/backPfe) (Django REST).

## Développement local

```bash
npm install
cp .env.example .env.local   # URL de l'API Django locale
npm run dev                  # http://localhost:3000
```

## Déploiement sur Vercel (bêta)

1. **Vercel → Add New → Project → importer ce dépôt** (`solidarlink-frontend`). Framework détecté : Next.js.
2. **Environment Variables** :

   | Variable | Valeur |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | URL du backend Vercel, ex. `https://ensemblelink-api.vercel.app` (sans `/` final) |
   | `NEXT_PUBLIC_WS_URL` | *(laisser vide)* → rafraîchissement automatique au lieu des WebSockets |

3. **Deploy**. Après avoir changé une variable `NEXT_PUBLIC_…`, relancer un déploiement (elles sont figées au build).
4. Ajouter l'URL du frontend dans la variable `CORS_ALLOWED_ORIGINS` du projet backend.

Le frontend n'a besoin d'**aucune clé Supabase** : il ne parle qu'à l'API Django.

## Pages

| Route | Contenu |
|---|---|
| `/` | Accueil, recherche, statistiques d'impact, causes, activités entre citoyens |
| `/missions` | Liste filtrable (type, cause, pays), vue carte, « près de moi » |
| `/missions/[id]` | Détail, participation / don, participants, groupe de discussion, agenda `.ics` |
| `/associations`, `/associations/[id]` | Annuaire et fiche publique avec avis |
| `/benevoles/[id]` | Profil public d'un citoyen (badges, avis) |
| `/connexion`, `/inscription` | Authentification JWT, comptes de démo en un clic |
| `/espace` | Tableau de bord (citoyen, association, admin) + alerte « Jour J » |
| `/espace/historique` | Historique : activités créées, rejointes, bénévolat, dons, avis |
| `/espace/annonce` | Création / modification d'annonce ou d'activité (pays, fuseau, carte) |
| `/messages` | Groupes d'activité et messages privés |

## Comptes de démo

Mot de passe commun : `Demo1234!` (boutons « Mode démo » sur la page Connexion)

- Admin : `admin@ensemblelink.demo`
- Bénévole (France) : `emma.martin@mail.ensemblelink.demo`
- Citoyen organisateur (Maroc) : `yassine.elamrani@mail.ensemblelink.demo`
- Citizen (UK) : `oliver.smith@mail.ensemblelink.demo`
- Association : `panier_solidaire@asso.ensemblelink.demo`

Les drapeaux sont des SVG de [flag-icons](https://github.com/lipis/flag-icons) (MIT), copiés dans `public/flags/`.
