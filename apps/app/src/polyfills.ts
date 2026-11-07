/*
 * Remplaçants pour les anciennes tablettes.
 *
 * Angular et Ionic utilisent des fonctions récentes du navigateur
 * (Object.hasOwn, Array.prototype.at, structuredClone...).
 * Une tablette dont la WebView est ancienne ne les connaît pas.
 * core-js ajoute seulement celles qui manquent :
 * sur un appareil récent, rien n'est remplacé.
 */
import 'core-js/stable';
