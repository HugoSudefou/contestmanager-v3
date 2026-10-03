# Contest Manager v3

Nouvelle version de l'application de gestion du défi robotique (remplace `contestmanagerappv2`, Ionic 3 / Angular 4 de 2019).

- **Appli mobile + web** (`apps/app`) : Angular 22, Ionic 9, Capacitor 8. Le même code donne l'APK Android, le site web et la PWA pour iPhone.
- **API** (`apps/api`) : NestJS 12, Prisma 7, PostgreSQL 18.
- **Moteur de score** (`packages/scoring`) : TypeScript pur, partagé entre l'appli (calcul en direct, même hors ligne) et l'API (le serveur recalcule le total : c'est lui qui fait foi).

## Fonctionnalités

| Qui | Quoi |
|---|---|
| Arbitre | Se connecte, choisit le tournoi, voit les matchs « à noter », remplit la feuille de mission (chrono, pénalités, total en direct), envoie le score. |
| Équipe | Cherche son équipe, voit ses matchs, ses scores et son meilleur score. |
| Entraînement | N'importe quelle feuille publiée, sans compte, scores gardés sur le téléphone. |
| Admin (`/admin`) | Crée les **concours** (feuilles de mission) sans code, les tournois, groupes, équipes (collage en masse), matchs, comptes arbitres. |

### Ajouter un nouveau concours (chaque année)

`Administration > Concours > Nouveau concours` (ou **dupliquer** celui de l'an dernier) :

1. Nom, saison, durée du chrono, points par pénalité.
2. Pour chaque mission : titre, explication, image, et des **lignes de score** :
   - *Case à cocher* : X points si réalisé ;
   - *Compteur* : N × points (avec un maximum), ex. « 5 pts par déchet, max 4 » ;
   - *Choix unique* : une option parmi plusieurs, chacune avec ses points.
3. *Options avancées* (facultatif) :
   - limite d'objets partagée entre lignes (« 4 blocs maximum », sinon la mission vaut 0) ;
   - règles bonus : « si choix 1 = Réussi **et** case X cochée alors +10 pts » (points négatifs possibles).
4. Cocher **Publié**, enregistrer, puis **Aperçu** pour tester la feuille.

Le bouton **JSON** permet d'exporter / importer une feuille entière (sauvegarde, copie entre serveurs).

Les feuilles 2019 (cycle 2 et cycle 3) de l'ancienne appli sont importées automatiquement au premier démarrage.

### En ligne / hors ligne

L'appli fonctionne en ligne par défaut. Si le réseau tombe :

- tournois, équipes et feuilles déjà consultés restent disponibles (cache local) ;
- les scores envoyés par l'arbitre sont mis **en attente** (badge sur l'accueil, liste dans *Réglages*) et partent automatiquement au retour du réseau ;
- un arbitre doit s'être connecté au moins une fois en ligne (session valable 7 jours).

> Conseil : avant la compétition, ouvrez le tournoi sur chaque téléphone arbitre pendant qu'il y a du réseau.

## Démarrage en local (développement)

Prérequis : Node 24, Docker.

```bash
npm install                       # installe tout (workspaces) et génère le client Prisma
cp .env.example .env              # secrets pour docker compose
cp apps/api/.env.example apps/api/.env
docker compose up -d db           # PostgreSQL
cd apps/api && npx prisma migrate dev && SEED_DEMO=1 npx prisma db seed && cd ../..
npm run dev:api                   # API sur http://localhost:3000
npm run dev:app                   # appli sur http://localhost:4200
```

Compte admin créé au premier démarrage de l'API : `ADMIN_USERNAME` / `ADMIN_PASSWORD` (`admin` / `change-me` par défaut, **à changer**). `SEED_DEMO=1` ajoute un tournoi de démonstration.

Tests du moteur de score : `npm test`.

## Mise en production (serveur / VPS)

```bash
cp .env.example .env    # mettre un JWT_SECRET long et aléatoire + le mot de passe admin
docker compose up -d --build
```

- Web + admin : `http://serveur:8080` (l'API est servie derrière, sur `/api`).
- API directe : `http://serveur:3000`.
- Les migrations s'appliquent toutes seules au démarrage du conteneur `api`.
- Mettre un reverse proxy HTTPS (Caddy, Traefik, nginx) devant le port 8080 pour un accès public.
- Données : volumes Docker `pgdata` (base) et `uploads` (images des missions).

## APK Android

### Sans rien installer (recommandé) : GitHub Actions

1. Pousser le dépôt sur GitHub.
2. Onglet **Actions > Android APK > Run workflow**, renseigner l'adresse du serveur (ex. `https://contest.mondomaine.fr/api`).
3. Télécharger l'artefact `contest-manager-apk`, copier `app-debug.apk` sur le téléphone et l'installer (autoriser « sources inconnues »).

### En local (avec Android Studio / SDK)

```bash
# mettre l'adresse du serveur dans apps/app/src/environments/environment.prod.ts (nativeApiUrl)
npm run build -w @contest/scoring && npm run build -w app
cd apps/app && npx cap sync android
cd android && ./gradlew assembleDebug   # -> app/build/outputs/apk/debug/app-debug.apk
```

Nécessite JDK 21 et le SDK Android (`ANDROID_HOME`). L'adresse du serveur peut aussi être changée dans l'appli (*Réglages*).

## iPhone (sans Mac)

Pas besoin d'APK : ouvrir le site (`http://serveur:8080`) dans **Safari**, puis *Partager > Sur l'écran d'accueil*. L'appli s'installe comme une appli (PWA) et fonctionne hors ligne.

## Structure

```
packages/scoring/     moteur de score + validation des feuilles (+ tests)
apps/api/             NestJS : auth JWT, concours, tournois, groupes, équipes, matchs, scores, upload d'images
  prisma/             schéma, migrations, seed (feuilles 2019)
apps/app/             Ionic Angular : pages arbitre / équipe / entraînement / admin
  android/            projet Android Capacitor
docker-compose.yml    db + api + web (nginx)
```
