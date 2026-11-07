// Compile l'appli pour qu'elle tourne aussi sur les anciennes tablettes.
//
// Angular 22 regroupe les fichiers en fin de compilation (étape « rolldown »).
// Cette étape remet de la syntaxe récente (?. et ??) que les anciennes
// WebView Android ne comprennent pas : écran blanc. On la désactive.
// La liste des navigateurs visés est dans .browserslistrc.
//
// Utilisation : node build.mjs [options de ng build]   (c'est « npm run build »)
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const env = { ...process.env, NG_BUILD_OPTIMIZE_CHUNKS: '0' };
const ng = spawnSync('npx', ['ng', 'build', ...process.argv.slice(2)], { stdio: 'inherit', env, shell: true });
if (ng.status !== 0) process.exit(ng.status ?? 1);

// Contrôle : aucune syntaxe trop récente ne doit rester dans les fichiers produits.
const out = 'www';
const recent = /\?\?(?!\/)|\?\.(?=[A-Za-z_$[(])/; // « ??/ » : expression régulière de core-js, pas de la syntaxe
const bad = readdirSync(out)
  .filter((f) => f.endsWith('.js') && !f.startsWith('ngsw') && !f.startsWith('worker') && !f.startsWith('safety'))
  .filter((f) => recent.test(readFileSync(join(out, f), 'utf8')));
if (bad.length) {
  console.error(`\nSyntaxe trop récente pour les anciennes tablettes dans : ${bad.join(', ')}`);
  console.error('Vérifier .browserslistrc et NG_BUILD_OPTIMIZE_CHUNKS.');
  process.exit(1);
}
console.log('Contrôle anciennes tablettes : OK (Chrome / WebView 66 et plus).');
