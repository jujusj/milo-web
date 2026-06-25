# Milo Web

Site promotionnel statique de Milo, application éducative inclusive pensée pour accompagner les enfants dyslexiques dans l'apprentissage de la lecture et du langage.

## Lancer le site

```bash
npm run dev
```

Le site est ensuite disponible sur `http://localhost:4173`.

## Déploiement Vercel

`vercel.json` force Vercel à traiter le projet comme un site statique servi depuis la racine du dépôt :

- `framework: null`
- `buildCommand: null`
- `outputDirectory: "."`

Cela évite qu'une commande de build cherche un dossier de sortie inexistant.

## Vérifier

```bash
npm run lint
npm run test
npm run build
```

Ces scripts utilisent `scripts/check-site.js` et ne nécessitent aucune dépendance externe. Ils vérifient la structure attendue, les pages, les images avec textes alternatifs, les marqueurs ARIA principaux et les fichiers SEO.

## Modifier les contenus

Les informations modifiables sont centralisées dans `content.js` :

- `targetAgeRange` : âge cible actuellement affiché comme `5 à 11 ans`.
- `releaseStatus` : utiliser `available` quand l'app est publiée, ou `preparation` si elle repasse en pré-lancement.
- `downloadUrl` : URL directe prioritaire si un seul lien de téléchargement doit être affiché.
- `appStoreUrl` et `playStoreUrl` : renseigner uniquement de vraies URL.
- `contactEmail`, `legalOwner`, `version`, `compatibility` : champs à compléter avant publication.
- `learningCategories` : catégories d'apprentissage affichées sur la landing page.

## Assets utilisés

- `assets/logo/milo-logo-transparent.png` : logo officiel détouré depuis la direction artistique fournie.
- `assets/mascot/milo-mascot.png` : mascotte Milo détourée depuis la direction artistique fournie.
- `assets/icons/icon-*.svg` : pictogrammes de style app, avec les couleurs de la DA.
- `assets/photos/child-tablet-home-hero.jpg`
- `assets/photos/child-tablet-classroom.jpg`
- `assets/photos/child-tablet-parent-home.jpg`
- `assets/photos/child-tablet-specialist.jpg`

## Assets manquants à ajouter plus tard

- Photos finales validées par le projet si une banque d'images ou un shooting réel est retenu.
- Image Open Graph dédiée au format 1200 x 630.
- Vraies URL App Store et Google Play, ou URL directe unique, pour activer les boutons de téléchargement.

## Téléchargement

La section téléchargement est en état `available`. Elle n'affiche pas de faux boutons actifs : renseigner `downloadUrl`, `appStoreUrl` ou `playStoreUrl` dans `content.js` pour activer le téléchargement direct.

## Accessibilité

Le site intègre :

- lien d'évitement ;
- landmarks sémantiques ;
- focus visible ;
- menu mobile accessible ;
- onglets ARIA avec navigation aux flèches ;
- accordéons avec `aria-expanded` ;
- labels visibles pour les préférences d'affichage ;
- respect de `prefers-reduced-motion` ;
- module de préférences d'affichage sauvegardé en `localStorage`.

Le site s'appuie sur les principes du RGAA et des WCAG, mais aucune conformité officielle n'est déclarée sans audit.

## Sobriété numérique

La version actuelle n'utilise pas de framework, pas de bibliothèque UI, pas de tracker marketing et pas de vidéo. La police Poppins est chargée via Google Fonts pour respecter la direction artistique. Les images sont utilisées avec dimensions explicites et montrent des situations d'usage plutôt que des écrans d'application.

## Pages

- `/`
- `/accessibilite/`
- `/confidentialite/`
- `/mentions-legales/`
- `/merci/`
