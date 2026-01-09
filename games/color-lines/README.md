# 🎨 Color Lines

## Description
Un jeu de rythme où vous utilisez les flèches directionnelles pour sélectionner une ligne et maintenez la touche pour colorier les barres grises qui arrivent de la droite.

## Objectif
Colorier les lignes grises au bon moment en maintenant la touche correspondante à leur ligne.

## Comment jouer

### Contrôles (Flèches directionnelles)
- **⬆️ Flèche Haut** : Sélectionne la ligne ⭐ Étoile (Orange)
- **➡️ Flèche Droite** : Sélectionne la ligne ⭕ Cercle (Vert)
- **⬇️ Flèche Bas** : Sélectionne la ligne 🟦 Rectangle (Bleu)
- **⬅️ Flèche Gauche** : Sélectionne la ligne 🔺 Triangle (Rouge)

**Important** : Une seule touche peut être active à la fois ! La dernière touche pressée prend le dessus.

### Mécaniques
1. **4 lignes horizontales colorées** avec leurs icônes :
   - ⭐ **Étoile - Orange** (#FFB755) - Flèche Haut
   - ⭕ **Cercle - Vert** (#A3FF56) - Flèche Droite
   - 🟦 **Rectangle - Bleu** (#54D8FF) - Flèche Bas
   - 🔺 **Triangle - Rouge** (#FF3246) - Flèche Gauche

2. **Lignes grises** : Des barres grises arrivent de la droite, chacune sur une des 4 lignes

3. **Colorier** : Maintenez la touche correspondante pendant que la barre passe pour la colorier progressivement. La barre se remplit à la même vitesse qu'elle avance.

4. **Scoring** :
   - Points = 10 × (largeur/100) × multiplicateur de combo
   - Enchaînez les succès pour augmenter votre combo !
   - Mauvaise ligne ou timing = perte d'une vie et reset du combo

## Difficulté progressive
- Toutes les 10 secondes, la difficulté augmente
- Les lignes arrivent plus vite
- L'intervalle entre les lignes diminue

## Vies
Vous commencez avec 3 vies ❤️❤️❤️. Vous perdez une vie si :
- Une ligne grise passe sans être entièrement coloriée
- Vous maintenez la mauvaise touche sur une ligne

## Technologies utilisées
- **p5.js** pour le rendu graphique
- **Flèches directionnelles** pour les contrôles
