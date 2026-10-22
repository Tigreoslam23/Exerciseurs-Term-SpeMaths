# Dérive Lab

Jeu de dérivation en TypeScript et React, pour ordinateur, tablette et téléphone.

Jouer : https://tigreoslam23.github.io/Exerciseurs-Term-SpeMaths/derive-lab/

## Parcours de Première

1. Constantes et identité : dérivées de c et de x.
2. Fonctions linéaires-affines : règle (ax+b)′ = a annoncée directement, a non nul.
3. Fonctions puissances : xⁿ, de n = 2 à n = 10.
4. Forme k × u(x) : identification et conservation du coefficient relatif non nul.
5. Somme de deux fonctions : identification de u et v, puis deux champs simultanés.
6. Fonction inverse : premier exemple 2/x, réécriture 2 × 1/x donnée.
7. Racine carrée : vraie barre de radical et coefficient de la fraction réduit.
8. Fonction exponentielle.
9. Sommes de deux à quatre fonctions : un bloc par terme et un signe +/− indépendant.
10. Produit : identification, dérivées, substitution par glisser-déposer, simplification.
11. Quotient : homographies non constantes, puis fractions de polynômes de degrés différents dont le degré maximal vaut 3.
12. Inverse d’une fonction u : u polynomiale de degré 1 à 5 ou combinaison de références ; deux champs pour −u′ et u², sans développer le dénominateur.
13. Composée affine : puissances, inverse, racine et exponentielle de ax+b.

Les approfondissements de Terminale sont conservés dans leur onglet.
Les exposants, les familles des sommes et les degrés des quotients progressent avec les exercices terminés. L’exploration libre fait aussi avancer cette difficulté pendant la session, sans modifier les XP.

## Interface et saisie

- Clavier à droite des réponses à partir de 701 px ; sous la réponse sur smartphone.
- Clavier natif mobile désactivé ; saisie au clavier physique et collage possibles.
- Touche fraction à deux cases, sélection du numérateur en premier, cases directement sélectionnables et bouton « Case suivante ».
- Touches racine, exponentielle, carré, puissances, signes et fonctions usuelles.
- Écriture mathématique Computer Modern avec fractions, primes et radicaux ; aucune dépendance CDN.
- Bouton de taille des explications : 100 %, 110 %, 120 %, préférence conservée localement.
- Bouton info de la compétence sélectionnée : statistiques dépliées dans la colonne gauche, entre deux compétences. Sur écran étroit, ce bouton est près du titre.
- Un dépôt incorrect conserve l’étape et permet de recommencer. Les cartes peuvent aussi être associées par deux clics ou au clavier.

## Progression

Trois réussites sans erreur ni indice dans les prérequis ouvrent la suite. La maîtrise demande au moins dix exercices et 80 % de réussites sans aide. Un exercice propre vaut 30 XP, un exercice aidé ou corrigé 10 XP. Les vingt derniers résultats sont conservés.

La migration vers la version 2 regroupe les anciens résultats « constantes + identité », « coefficient + signes » et « puissances + carrés/cubes », sans ajouter d’XP. Les compétences déjà pratiquées restent accessibles. La progression est locale au navigateur, sans synchronisation entre appareils.

## Développement

```sh
npm ci
npm run typecheck
npm test
npm run dev
```

`npm test` compile l’application puis vérifie les générateurs par différences finies, la migration, les treize parcours complets dans un DOM de test, les champs simultanés, les fractions et leur ordre de saisie, les signes, le radical et les boutons d’interface.

- `curriculum.ts` : parcours de Première et génération des exercices.
- `learning-workshop.tsx` : étapes, identification et réponses multiples.
- `math-entry.tsx` : champs mathématiques et clavier commun.
- `math-display.tsx` : présentation des fractions, racines, puissances et primes.
- `math-engine.ts` : lecture et comparaison numérique des expressions.
- `rule-assembly.tsx` : substitution dans les règles du produit et du quotient.
- `app.tsx` : navigation, progression, installation et approfondissements.
- `styles.css` : présentation responsive.

Les expressions utilisateur ne sont jamais exécutées comme du JavaScript. La comparaison en plusieurs points reste une vérification numérique, pas une preuve symbolique.

## Publication et mode hors connexion

`npm run build` produit `app.js`, met à jour les URL de contenu dans `index.html` et renouvelle le cache de `sw.js`. Les fichiers compilés sont conservés dans le dépôt pour GitHub Pages ; `dist/` est une sortie locale de compilation.

Après une première ouverture complète avec Internet, l’application peut fonctionner hors connexion. Sur Android, ouvrir le lien dans Chrome puis utiliser Installer ; sur iPhone/iPad, utiliser Safari → Partager → Sur l’écran d’accueil. La progression reste propre à l’appareil et au navigateur.
