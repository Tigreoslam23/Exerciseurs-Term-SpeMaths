# Dérive Lab

Jeu de calcul de dérivées en **TypeScript / React**, adapté aux ordinateurs, tablettes et téléphones.

**Jouer :** https://tigreoslam23.github.io/Exerciseurs-Term-SpeMaths/derive-lab/

## Premier essai

Le jeu démarre sur `f(x) = 4x²` :

1. Glisser la boîte arrondie `4` sur `k`, dans le bloc « Forme k × u(x) » : `k = 4` apparaît et le coefficient devient `k` dans la fonction de départ.
2. Glisser la boîte `x²` sur `u(x)` : `u(x) = x²` apparaît et la fonction de départ devient `f(x) = k × u(x)`. Les deux éléments peuvent être identifiés dans l’ordre choisi par l’élève.
3. Cliquer sur « Appliquer la règle (ku)′ = ku′ », puis choisir `2x` dans la roue des dérivées.
4. Saisir `8` au clavier pour obtenir `f′(x) = 8x`.

Les boîtes suivent la souris, le stylet ou le doigt pendant le déplacement. On peut aussi sélectionner une boîte puis sa destination, y compris avec Tab et Entrée/Espace. Un dépôt incorrect conserve l’étape et donne un indice ; Échap annule la sélection ou le déplacement. Cette identification s’applique à tous les ateliers qui commencent par un coefficient constant.

## Contenu

24 compétences : constantes, identité, carrés et cubes, coefficients, signes, puissances, fonctions affines, sommes, inverse, racine, produit, quotient, exponentielle, logarithme, compositions, trigonométrie et synthèse.

Les exercices sont générés aléatoirement. Les niveaux Première / Terminale organisent le jeu ; certaines notions, dont l’exponentielle, peuvent être étudiées plus tôt selon la progression de la classe.

- Trois exercices terminés sans erreur ni indice dans chaque prérequis débloquent la suite.
- Maîtrise : au moins 10 exercices terminés, dont 80 % sans erreur ni indice.
- 30 XP pour un exercice sans erreur ni indice ; 10 XP après aide ou erreur.
- Exploration libre des ateliers verrouillés, sans points ni déblocages.
- Historique visuel des 20 derniers exercices, avec stries pour les exercices aidés ou corrigés.
- Clavier numérique et mathématique, clavier physique, indices et mémo.
- Thèmes clair et sombre.
- Sauvegarde locale de la progression dans le navigateur ; aucune synchronisation entre appareils.

## Fichiers

- `app.tsx` : source TypeScript de l’application, des exercices et du validateur.
- `styles.css` : interface responsive.
- `index.html` et `bootstrap.js` : lancement direct depuis GitHub Pages.
- `package.json`, `tsconfig.json`, `build.mjs` : outils facultatifs de vérification et compilation.

La page directe charge React 18.3.1 et Babel 7.26.4 depuis des CDN, avec un second fournisseur en cas d’erreur. **Une connexion Internet est nécessaire.** Le fichier TSX est transformé côté navigateur : aucune installation n’est requise pour jouer depuis GitHub Pages. Ouvrir uniquement `index.html` par double-clic peut bloquer le chargement du TSX ; utiliser l’adresse publiée ou un serveur local.

## Développement local

Avec Node.js et npm, depuis ce dossier :

```sh
npm install
npm run typecheck
npm run dev
```

Ouvrir ensuite http://localhost:5173.

Compilation facultative :

```sh
npm run build
```

Le dossier `dist/` contient alors la version avec JavaScript précompilé. Elle conserve le chargement de React depuis un CDN.

## Vérifications et limites

Les 24 générateurs ont été soumis à 2 160 comparaisons numériques entre leur dérivée attendue et une différence finie, sur 720 exercices aléatoires, sans écart détecté dans la tolérance choisie. Le validateur a également été essayé sur les signes, fractions, puissances, multiplications implicites et fonctions usuelles.

Les expressions saisies sont lues par un petit analyseur, sans `eval` ni exécution de code utilisateur. L’équivalence mathématique est estimée en plusieurs points : ce n’est pas un système de calcul formel ni une preuve symbolique.

La mise à jour de l’identification par glisser-déposer a passé la vérification TypeScript et la compilation. Des essais dans Chromium ont vérifié les deux dépôts à la souris et au toucher (émulation Pixel 7), les destinations incorrectes, l’identification dans les deux ordres, le clavier et la sélection par deux appuis. Le parcours initial `4x² → 8x` attribue toujours 30 XP sans erreur ni aide. Les captures ordinateur et téléphone ont été inspectées, sans débordement horizontal sur le téléphone testé. Les dépendances CDN ont été servies localement dans leurs versions exactes pendant ces essais ; le chargement réseau en conditions réelles et les autres navigateurs restent à vérifier.
