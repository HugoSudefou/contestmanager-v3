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
| Enseignant | Voit ses équipes, leurs matchs et scores, et gère la liste des élèves (nom, prénom, rôle). |
| Admin (`/admin`) | Crée les **concours** (feuilles de mission) sans code, les tournois, groupes, équipes (collage en masse ou **import Excel**), matchs, **phase finale**, comptes arbitres / enseignants. |

### Ajouter un nouveau concours (chaque année)

`Administration > Concours > Nouveau concours` (ou **dupliquer** celui de l'an dernier) :

1. Nom, saison, durée du match (0 = **chronomètre libre**, sans limite), points par pénalité, **maximum de pénalités** (vide = illimité), et l'option **départager les égalités au temps**.
2. Pour chaque mission : titre, explication, image, et des **lignes de score** :
   - *Case à cocher* : X points si réalisé ;
   - *Compteur* : N × points (avec un maximum), ex. « 5 pts par déchet, max 4 » ;
   - *Choix unique* : une option parmi plusieurs, chacune avec ses points.
3. *Options avancées* (facultatif) :
   - limite d'objets partagée entre lignes (« 4 blocs maximum », sinon la mission vaut 0) ;
   - règles bonus : « si choix 1 = Réussi **et** case X cochée alors +10 pts » (points négatifs possibles).
4. Cocher **Publié**, enregistrer, puis **Aperçu** pour tester la feuille.

Le bouton **JSON** permet d'exporter / importer une feuille entière (sauvegarde, copie entre serveurs).

Les feuilles 2019 (cycle 2 et cycle 3) de l'ancienne appli et les feuilles **Défi Mars II 2027** (cycle 2 et cycle 3) sont importées automatiquement au démarrage (une feuille déjà présente sous le même nom n'est pas recréée).

### Chronomètre et départage au temps

- Avec une durée de 0, le chrono de la feuille arbitre est un **chronomètre libre** : il compte sans limite, se met en pause, et le bouton ↻ le remet à zéro sans effacer la feuille (pratique pour chronométrer le passage complet après des missions validées une par une). Chronométrer reste facultatif : un score envoyé à 00:00 est « non chronométré ».
- Si l'option **départager au temps** est cochée, à points égaux le temps le plus court l'emporte (classement des groupes, qualification et matchs de la phase finale) ; un passage chronométré passe devant un passage non chronométré.

### Défi Mars II 2027

Feuilles `Défi Mars II 2027 - Cycle 2` et `- Cycle 3` (règlement robotique92) : 6 missions sur 100 points (+10 pour une provision empilée), bonus technologique (100 max) et bonus pédagogique (100 max), 5 points par pénalité (10 maximum), chronomètre libre avec départage au temps. Les images sont dans `apps/app/src/assets/mars2027/`.

Sur un serveur déjà en service, sans redéployer : créer un concours, ouvrir **JSON** et coller `docs/defi-mars-2027-cycle2.json` (ou `cycle3`). Les images des missions n'apparaissent qu'après le déploiement de la nouvelle version de l'appli.

### Import des inscriptions (Excel)

`Administration > Tournois > (tournoi) > Importer les inscriptions` : même classeur que l'ancien back office (modèle : `docs/modele-inscriptions.xlsx`), ligne 1 = en-têtes :

| Onglet | Colonnes |
|---|---|
| `ecole` | id, nom |
| `classe` | id, enseignant (« Prénom Nom »), classe, niveau |
| `equipe` | id, puis (nom, prénom, rôle) × élèves |
| `ecole-classe-equipe` | id école, id classe, id équipe |

L'appli affiche un aperçu (et les lignes en erreur), on choisit le concours joué par niveau, puis l'import crée : les écoles, **un groupe par classe**, les équipes (« Équipe 12 »), les élèves et **un compte enseignant par enseignant** avec un mot de passe aléatoire affiché une seule fois (export CSV). Réimporter le même fichier met à jour sans doublon.

Les noms des élèves (mineurs) ne sont visibles que par les admins et l'enseignant de l'équipe, jamais dans les pages publiques.

### Phase finale

`Administration > Tournois > (tournoi) > Phase finale` : choisir le concours, 2/4/8/16 équipes, l'heure de début et la durée d'un tour. Sont qualifiées la meilleure équipe de chaque groupe puis les meilleurs scores restants, placées en tableau (1 contre 8, 4 contre 5…). Un groupe « Phase finale » est créé ; les arbitres notent ces matchs comme les autres et **le gagnant passe automatiquement au tour suivant**. En cas d'égalité rien ne bouge : faire rejouer et ressaisir le score. Le tableau s'affiche dans l'appli (côté équipes).

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

Tests (moteur de score, tableau de phase finale) : `npm test`.

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
