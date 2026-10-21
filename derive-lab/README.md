# Dérive Lab

Jeu de calcul de dérivées en **TypeScript / React**, adapté aux ordinateurs, tablettes et téléphones.

**Jouer :** https://tigreoslam23.github.io/Exerciseurs-Term-SpeMaths/derive-lab/

## Premier essai

Le jeu démarre sur `f(x) = 4x²` :

1. Glisser la boîte arrondie `4` sur `k`, dans le bloc « Forme k × u(x) » : `k = 4` apparaît et le coefficient devient `k` dans la fonction de départ.
2. Glisser la boîte `x²` sur `u(x)` : `u(x) = x²` apparaît et la fonction de départ devient `f(x) = k × u(x)`. Les deux éléments peuvent être identifiés dans l’ordre choisi par l’élève.
3. Cliquer sur « Appliquer la règle (ku)′ = ku′ », puis saisir soi-même `2x` avec le clavier mathématique juste sous la case et valider.
4. Saisir `8` avec le clavier maths placé sous la case pour obtenir `f′(x) = 8 × x`.

Les boîtes suivent la souris, le stylet ou le doigt pendant le déplacement. On peut aussi sélectionner une boîte puis sa destination, y compris avec Tab et Entrée/Espace. Un dépôt incorrect conserve l’étape et donne un indice ; Échap annule la sélection ou le déplacement. Cette identification s’applique à tous les ateliers qui commencent par un coefficient constant.

## Contenu

24 compétences : constantes, identité, carrés et cubes, coefficients, signes, puissances, fonctions affines, sommes, inverse, racine, produit, quotient, exponentielle, logarithme, compositions, trigonométrie et synthèse.

Les exercices sont générés aléatoirement. Les niveaux Première / Terminale organisent le jeu ; certaines notions, dont l’exponentielle, peuvent être étudiées plus tôt selon la progression de la classe.

- Trois exercices terminés sans erreur ni indice dans chaque prérequis débloquent la suite.
- Maîtrise : au moins 10 exercices terminés, dont 80 % sans erreur ni indice.
- 30 XP pour un exercice sans erreur ni indice ; 10 XP après aide ou erreur.
- Exploration libre des ateliers verrouillés, sans points ni déblocages.
- Historique visuel des 20 derniers exercices, avec stries pour les exercices aidés ou corrigés.
- Clavier mathématique sous la réponse, visible à chaque dérivée à saisir et lors du calcul final ; clavier système mobile désactivé. Le clavier physique reste utilisable sur ordinateur.
- Signe × dans les calculs et police mathématique homogène entre formules, cases et touches.
- Installation sur l’appareil et fonctionnement hors connexion après un premier chargement complet.
- Indices et mémo.
- Thèmes clair et sombre.
- Sauvegarde locale de la progression dans le navigateur ; aucune synchronisation entre appareils.

## Fichiers

- `app.tsx` : source TypeScript de l’application, des exercices et du validateur.
- `styles.css` : interface responsive.
- `index.html` et `bootstrap.js` : lancement direct depuis GitHub Pages.
- `package.json`, `tsconfig.json`, `build.mjs` : outils facultatifs de vérification et compilation.

L’application publiée utilise `app.js`, qui regroupe React et le jeu compilé. Aucun CDN ni Babel n’est chargé au démarrage. Les fichiers `manifest.webmanifest`, `sw.js` et les icônes permettent l’installation et le stockage local des ressources. Une première ouverture avec Internet est nécessaire pour préparer le mode hors connexion.

Pour installer sur Android : ouvrir le lien dans Chrome, puis toucher **Installer** dans l’application ou utiliser le menu **⋮ → Installer l’application**. Si le lien est ouvert dans la fenêtre intégrée de ChatGPT, commencer par **Ouvrir dans Chrome**. Sur iPhone/iPad : Safari → Partager → Sur l’écran d’accueil.

## Développement local

Avec Node.js et npm, depuis ce dossier :

```sh
npm ci
npm run typecheck
npm run build
npm run dev
```

Ouvrir ensuite http://localhost:5173.

Après chaque modification du TypeScript :

```sh
npm run build
```

La compilation met à jour `app.js` et la version du cache dans `sw.js`, puis prépare le dossier `dist/`. Pour GitHub Pages, conserver également ces fichiers générés dans le dépôt à côté de `index.html`. Le service worker agit uniquement dans le dossier `derive-lab/` et ne modifie pas les autres applications du domaine.

## Vérifications et limites

Les 24 générateurs ont été soumis à 2 160 comparaisons numériques entre leur dérivée attendue et une différence finie, sur 720 exercices aléatoires, sans écart détecté dans la tolérance choisie. Le validateur a également été essayé sur les signes, fractions, puissances, multiplications implicites et fonctions usuelles.

Les expressions saisies sont lues par un petit analyseur, sans `eval` ni exécution de code utilisateur. L’équivalence mathématique est estimée en plusieurs points : ce n’est pas un système de calcul formel ni une preuve symbolique.

La mise à jour de l’identification par glisser-déposer a passé la vérification TypeScript et la compilation. Des essais dans Chromium ont vérifié les deux dépôts à la souris et au toucher (émulation Pixel 7), les destinations incorrectes, l’identification dans les deux ordres, le clavier et la sélection par deux appuis. Le parcours initial `4x² → 8x` attribue toujours 30 XP sans erreur ni aide. Les captures ordinateur et téléphone ont été inspectées, sans débordement horizontal sur le téléphone testé. Les dépendances CDN ont été servies localement dans leurs versions exactes pendant ces essais ; le chargement réseau en conditions réelles et les autres navigateurs restent à vérifier.


La mise à jour de saisie/installation passe la vérification TypeScript et la compilation de production. Les essais de navigateur réalisés pour cette mise à jour sont décrits dans la réponse de livraison ; un essai sur l’appareil Android réel reste nécessaire pour confirmer le dialogue d’installation de son système.

## Présentation des fractions et identification

Les fractions sont composées avec un numérateur, une barre horizontale et un dénominateur, y compris dans les fonctions, les boîtes à déplacer, les cases de saisie, les règles, le mémo, les résultats et les touches. Les puissances restent dans le dénominateur et les parenthèses sont conservées autour des expressions dérivées. La saisie d’un résultat fractionnaire place la case dans le numérateur ; les expressions saisies utilisent également un aperçu composé dans la case.

Sur les écrans suffisamment larges, le bloc d’identification k × u(x) est directement à droite de la fonction de départ. Le bouton d’application de la règle est plus compact et reste sous cette ligne. Le bloc s’adapte en dessous lorsque la largeur disponible est insuffisante sur un téléphone.

## Saisie des dérivées

Chaque dérivée intermédiaire se complète librement avec le clavier mathématique sous la ligne, sans carrousel ni point d’interrogation. La validation accepte les écritures mathématiquement équivalentes (par exemple `2x`, `2*x` ou `x+x`). Une erreur conserve la saisie et l’étape pour permettre la correction ; une réponse correcte ouvre une case vide sur la ligne de simplification suivante. Le choix de la règle et l’identification de k et u(x) sont conservés.

## Typographie mathématique

Les formules et les touches utilisent les fontes Computer Modern distribuées avec KaTeX 0.16.22 : chiffres droits, variables italiques et vraie prime en exposant avec un espacement dédié. Seules les fontes sont embarquées, dans `math-fonts.css` ; le moteur de rendu structuré de l’application reste utilisé. La licence figure dans `MATH-FONTS-LICENSE.txt`. Aucune police distante n’est chargée.

Les résultats finaux et leur dernière ligne de calcul utilisent la juxtaposition (`3x²+14x+3`, `8x`, `4eˣ`). Les étapes intermédiaires conservent × pour expliciter la méthode. Les fractions, puissances et groupements restent structurés ; deux facteurs numériques ne sont jamais concaténés. Les fichiers du jeu, des styles et des fontes ont une URL versionnée et sont préchargés dans le cache hors connexion.
