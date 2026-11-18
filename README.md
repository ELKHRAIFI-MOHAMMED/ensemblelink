# SolidarLink — Frontend

Application Next.js 16 (App Router, TypeScript, Tailwind CSS v4) de la plateforme SolidarLink, qui relie associations et bénévoles.

API : dépôt [backPfe](https://github.com/ELKHRAIFI-MOHAMMED/backPfe/tree/v2) (Django REST + Channels).

## Démarrage

```bash
npm install
cp .env.example .env.local   # URL de l'API Django
npm run dev                  # http://localhost:3000
```

Le backend doit tourner sur `http://127.0.0.1:8000` (voir le README du dépôt backPfe).

## Pages

| Route | Contenu |
|---|---|
| `/` | Accueil, recherche, statistiques d'impact, causes, prochaines missions |
| `/missions` | Liste filtrable, vue carte, « près de moi » |
| `/missions/[id]` | Détail, candidature ou don, agenda `.ics`, signalement |
| `/associations`, `/associations/[id]` | Annuaire et fiche publique avec avis |
| `/benevoles/[id]` | Profil public d'un bénévole (badges, avis) |
| `/connexion`, `/inscription` | Authentification JWT, comptes de démo en un clic |
| `/espace` | Tableau de bord selon le rôle : bénévole, association ou admin |
| `/espace/annonce` | Création / modification d'annonce ou d'activité citoyenne (pays, fuseau, carte) |
| `/messages` | Messagerie temps réel : groupes d'activité (fermeture automatique) et messages privés |

## Comptes de démo

Mot de passe commun : `Demo1234!`

- Admin : `admin@solidarlink.local`
- Association : `panier_solidaire@asso.solidarlink.local`
- Bénévole : `emma.martin@mail.solidarlink.local`
- Citoyen organisateur (Maroc) : `yassine.elamrani@mail.solidarlink.local`
- Citizen (UK) : `oliver.smith@mail.solidarlink.local`

Les drapeaux sont des SVG de [flag-icons](https://github.com/lipis/flag-icons) (MIT), copiés dans `public/flags/`.
