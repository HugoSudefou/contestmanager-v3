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
| Entraînement | Les 4 concours **intégrés à l'appli** (RoBee, GardBot, Mars II cycle 2 et cycle 3), sans compte, **sans serveur ni connexion**, scores gardés sur l'appareil. Pour les classes avant le tournoi. |
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

**Importer (fichier JSON)** (liste des concours) crée un concours à partir d'un fichier choisi sur l'appareil : un concours complet (`name`, `season`, `description`, `sheet`) ou une feuille seule (le nom du fichier devient le nom du concours). Le concours importé est un **brouillon** : le publier dans l'éditeur. L'icône ⬇ d'un concours l'exporte dans ce même format (sauvegarde, copie vers un autre serveur). Les fichiers des 4 concours sont dans `docs/concours/`. Le bouton **JSON** de l'éditeur reste disponible pour coller une feuille.

Les feuilles 2019 (cycle 2 et cycle 3) de l'ancienne appli et les feuilles **Défi Mars II 2027** (cycle 2 et cycle 3) sont importées automatiquement au démarrage (une feuille déjà présente sous le même nom n'est pas recréée).

### Règle de notation (affichée sur chaque feuille)

Pendant le match, l'arbitre se concentre sur le robot et les pénalités ; les points se comptent à la fin, d'après la **position finale de chaque objet** (et du robot), jamais d'après la façon dont il y est arrivé. Exception : ce qui ne laisse pas de trace (son, mélodie, danse, arrêt demandé) se note quand l'arbitre le constate. Les libellés des feuilles décrivent donc des positions, pas des actions.

### Déroulement d'une partie (affiché sur chaque feuille)

Robot bloqué : le pilote demande à l'arbitre de le reprendre (1 pénalité), il est replacé dans la zone d'où il venait. Fin : l'équipe éteint son robot et annonce « Nous avons terminé notre défi. Nous souhaitons être évalués. » (chrono arrêté). Évaluation avec l'équipe : pénalités annoncées d'abord, chaque mission validée par l'équipe, score annoncé, puis échange sur les progrès.

### Chronomètre et départage au temps

- **Minuteur de l'arbitre** : en tournoi, sur une feuille sans durée fixe, le bouton ⏳ permet de choisir avant chaque partie une durée maximale (aucune, 2 à 10 minutes, ou une autre durée). Le chrono décompte alors et s'arrête à la fin ; le choix est gardé sur l'appareil pour les parties suivantes. À l'entraînement, pas de minuteur : chronomètre libre.

- Avec une durée de 0, le chrono de la feuille arbitre est un **chronomètre libre** : il compte sans limite, se met en pause, et le bouton ↻ le remet à zéro sans effacer la feuille (pratique pour chronométrer le passage complet après des missions validées une par une). Chronométrer reste facultatif : un score envoyé à 00:00 est « non chronométré ».
- Si l'option **départager au temps** est cochée, à points égaux le temps le plus court l'emporte (classement des groupes, qualification et matchs de la phase finale) ; un passage chronométré passe devant un passage non chronométré.

### Défi Mars II 2027

Feuilles `Défi Mars II 2027 - Cycle 2` et `- Cycle 3` (règlement robotique92) : 6 missions sur 100 points (+10 pour une provision empilée), bonus technologique (100 max) et bonus pédagogique (100 max), 5 points par pénalité (10 maximum), chronomètre libre avec départage au temps. Images dans `apps/app/src/assets/mars2027/`.

### Concours intégrés (entraînement hors ligne)

La page **Entraînement** n'interroge pas le serveur : ses 4 feuilles sont compilées dans l'appli (`apps/app/src/app/builtin-contests.ts`), et l'appli web (PWA) précharge les images des missions. Une fois l'appli ouverte une fois (ou l'APK installé), les enseignants peuvent s'entraîner en classe sans réseau.

Ces feuilles sont générées à partir de `apps/api/prisma/seed-contests.json` (source unique) : après une modification du barème, lancer `python3 scripts/make_builtin.py .` qui régénère `builtin-contests.ts` et `docs/concours/*.json` ; `npm test` vérifie que les trois restent identiques.

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

## Anciennes tablettes

L'appli doit aussi tourner sur d'anciennes tablettes Android pendant les défis.

- Elle est compilée pour **Chrome / Android System WebView 66 et plus** (`apps/app/.browserslistrc`).
  Testé avec Chromium 66, 67, 68, 70 et 72 : les 4 feuilles s'affichent, les images se chargent, la saisie fonctionne.
- `apps/app/src/polyfills.ts` (core-js) ajoute les fonctions récentes qui manquent aux anciennes WebView.
- `npm run build` lance `apps/app/build.mjs`. Ce script désactive l'étape de regroupement d'Angular 22
  (`NG_BUILD_OPTIMIZE_CHUNKS=0`), qui remettait une syntaxe trop récente (écran blanc).
  Le build échoue s'il reste de la syntaxe trop récente.
- L'APK s'installe à partir d'Android 7.0. Si la WebView de la tablette est plus ancienne que la version 66,
  l'appli affiche `webview-trop-ancienne.html`, qui explique comment la mettre à jour depuis le Play Store.
- Sur les écrans de terrain, les espacements utilisent des marges, pas `gap`, qui n'existe pas avant Chrome 84.

## Qui évalue quoi : menu avant la feuille

Une équipe est évaluée en quatre parties séparées (champ `part` des missions) :

| Partie | Qui évalue | Quand |
| --- | --- | --- |
| Matchs (missions + pénalités) | l'arbitre (en général un parent par équipe) | à chaque match ; **seul le meilleur match compte** |
| Bonus Attitude | l'arbitre | une fois les matchs de l'équipe terminés |
| Bonus pédagogique (affiche, présentation orale) | les conseillers pédagogiques | une fois |
| Bonus technologique | les référents numériques | une fois |

**Score final = meilleur match + Bonus Attitude + Bonus pédagogique + Bonus technologique.**

- Arbitre en tournoi : onglet « Équipes », choisir l'équipe, puis le menu propose ses matchs, le bouton
  « Évaluation des matchs terminée : l'arbitre passe à l'évaluation de l'attitude de l'équipe » et les trois bonus.
- En classe (entraînement, sans serveur) : le même menu, pour chaque défi.
- Serveur : les bonus sont enregistrés dans la table `TeamEvaluation` (`POST /teams/:id/evaluations`),
  les matchs ne comptent que les missions de match et les pénalités.
- Les phases finales (quarts, demies, finale) se jouent toujours sur les scores de match.

## Demi-journée de défi : accès, codes d'équipe, tablette, classement

**Accès**
- **Arbitre** (les parents) : bouton « Je suis arbitre », **sans mot de passe** (compte partagé `arbitre`, créé automatiquement).
  Note les matchs et le bonus Attitude.
- **Bonus pédagogique et technologique** (conseillers pédagogiques, référents numériques) : un **mot de passe très simple**
  (ex. `1234`), donné par l'admin à un compte de rôle « Évaluateur bonus ». Note l'affiche, l'oral et le bonus technologique.
- **Admin** : identifiant + mot de passe, crée les tournois, accès à tout.

**Codes d'équipe** : chaque classe (groupe « École - Classe - Enseignant ») a une lettre (A, B, C… donnée automatiquement
à la création ou à l'import), chaque équipe un numéro dans sa classe : **A1, A2, B1…**

**Tablette** : l'arbitre choisit son équipe une fois ; la tablette la suit ensuite toute la demi-journée
(l'accueil affiche « Arbitre · A1 · … », bouton « Changer d'équipe »). **Chaque score est gardé sur la tablette avant
d'être envoyé** (liste « Scores gardés sur cette tablette ») ; sans réseau il attend et part au retour du réseau.

**Classement en direct** (« Classement et équipes », mis à jour toutes les 20 s) : score final = meilleur match + bonus.
Le **podium ne retient que la meilleure équipe de chaque classe** ; la liste complète marque d'une étoile la meilleure de chaque classe.

**Finale** (administration du tournoi) : « Finale des classes » = un seul match avec la meilleure équipe de chaque classe
(2 à 6 équipes) ; « Tableau » = phases finales à 2, 4, 8 ou 16. Les deux classent sur le score final.

**Entraînement en classe** : la feuille complète (missions + bonus) s'ouvre directement, sans menu ; les essais s'enregistrent sur l'appareil.
