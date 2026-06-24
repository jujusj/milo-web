# Milo Web

Site promotionnel statique de Milo, application éducative inclusive pensée pour accompagner les enfants dyslexiques dans l'apprentissage de la lecture et du langage.

## Lancer le site

```bash
npm run dev
```

Le site est ensuite disponible sur `http://localhost:4173`.

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
- `releaseStatus` : utiliser `preparation` tant que l'app n'est pas publiée, ou `available` quand les liens stores sont prêts.
- `appStoreUrl` et `playStoreUrl` : renseigner uniquement de vraies URL.
- `contactEmail`, `legalOwner`, `version`, `compatibility` : champs à compléter avant publication.
- `learningCategories` : catégories d'apprentissage affichées sur la landing page.

## Assets utilisés

- `assets/logo/milo-logo.png` : logo recadré depuis l'écran de chargement fourni.
- `assets/screenshots/milo-app-home.png`
- `assets/screenshots/milo-app-lessons.png`
- `assets/screenshots/milo-app-exercises.png`
- `assets/screenshots/milo-app-onboarding-reward.png`
- `assets/screenshots/milo-app-games.png`
- `assets/screenshots/milo-app-profile-avatars.png`
- `assets/screenshots/milo-parent-dashboard-tools-accessibility.png`
- `assets/screenshots/milo-screen-time-settings.png`
- `assets/screenshots/milo-access-management.png`
- `assets/screenshots/milo-security-privacy.png`

## Assets manquants à ajouter plus tard

- Logo officiel détouré si disponible.
- Mascotte Milo isolée en PNG/WebP/SVG officiel, sans recadrage ni déformation.
- Image Open Graph dédiée au format 1200 x 630.
- Vraies URL App Store et Google Play si l'application est publiée.

## Formulaire

Le formulaire de préinscription effectue une validation côté client et appelle `api/preinscription.js` pour la validation côté serveur sur Vercel. L'API ne stocke pas encore les adresses : connecter l'outil d'emailing ou la base retenue avant lancement.

## Accessibilité

Le site intègre :

- lien d'évitement ;
- landmarks sémantiques ;
- focus visible ;
- menu mobile accessible ;
- onglets ARIA avec navigation aux flèches ;
- accordéons avec `aria-expanded` ;
- labels visibles et erreurs associées aux champs ;
- respect de `prefers-reduced-motion` ;
- module de préférences d'affichage sauvegardé en `localStorage`.

Le site s'appuie sur les principes du RGAA et des WCAG, mais aucune conformité officielle n'est déclarée sans audit.

## Sobriété numérique

La version actuelle n'utilise pas de framework, pas de bibliothèque UI, pas de tracker marketing, pas de police externe et pas de vidéo. Les images sont les captures fournies, renommées proprement et utilisées avec dimensions explicites.

## Pages

- `/`
- `/accessibilite/`
- `/confidentialite/`
- `/mentions-legales/`
- `/merci/`
