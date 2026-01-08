# 🚀 Guide de démarrage rapide

## 📦 Installation

1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```

3. **Ouvrir le jeu :**
   Le navigateur devrait s'ouvrir automatiquement sur `http://localhost:3000/game.html`

## 📁 Structure du projet

```
.
├── game.html                 # Page principale du jeu
├── main.js                   # GameManager (gestion globale)
├── styles.css                # Styles Tailwind V4 + Kawaii
├── vite.config.js            # Configuration Vite
├── package.json              # Dépendances
│
└── games/                    # Dossier des mini-jeux
    ├── BaseGame.js           # Classe de base pour tous les jeux
    ├── ADDING_GAMES.md       # Guide pour ajouter des jeux
    │
    └── wall-shapes/          # Premier mini-jeu
        └── WallShapesGame.js
```

## 🎮 Architecture

### GameManager (`main.js`)
Le cerveau du jeu qui gère :
- ✅ Chargement des mini-jeux
- ✅ Transitions entre écrans (menu, tutoriel, jeu, game over)
- ✅ Score global
- ✅ Séquence de jeux

### BaseGame (`games/BaseGame.js`)
Classe abstraite que tous les mini-jeux doivent étendre. Fournit :
- ✅ API standard (`init()`, `start()`, `update()`, `cleanup()`)
- ✅ Gestion du score
- ✅ Gestion des inputs
- ✅ Intégration avec le GameManager

### Mini-jeux (`games/*/`)
Chaque mini-jeu est **totalement indépendant** dans son propre dossier.

## 🛠️ Technologies utilisées

- **Vite** - Build tool rapide
- **Tailwind CSS V4** - Framework CSS avec couleurs Kawaii personnalisées
- **P5.js** - Librairie de dessin
- **P5play** - Framework de jeu basé sur P5.js
- **ML5.js** - Machine Learning pour la détection de pose/main
- **MakeyMakey** - Contrôleur physique (émulation clavier)

## 🎨 Palette de couleurs Kawaii

| Nom | Hex | Variable CSS | RGB |
|-----|-----|--------------|-----|
| Orange | #FFB755 | `--color-primary` | 255, 183, 85 |
| Lime | #A3FF56 | `--color-secondary` | 163, 255, 86 |
| Beige | #F2EEE5 | `--color-background` | 242, 238, 229 |
| Noir | #000000 | `--color-text` | 0, 0, 0 |

## 🎯 Jeux disponibles

### 🧱 Wall Shapes Game (Formes dans les murs)
- **Technologie :** ML5 PoseNet
- **Input :** Webcam (détection de pose)
- **Objectif :** Reproduire la pose affichée sur le mur avant qu'il n'arrive

## ➕ Ajouter un nouveau jeu

Consultez le guide détaillé : [games/ADDING_GAMES.md](games/ADDING_GAMES.md)

**Résumé rapide :**
1. Créer un dossier `games/mon-jeu/`
2. Créer `MonJeu.js` qui étend `BaseGame`
3. Implémenter les méthodes obligatoires
4. Enregistrer le jeu dans `main.js`

## 🐛 Debugging

### Vérifier les logs
Ouvrez la console (F12) pour voir :
- Chargement des jeux
- Changements d'écran
- Scores
- Erreurs éventuelles

### Problèmes courants

**Webcam ne fonctionne pas :**
- Vérifiez les permissions du navigateur
- Utilisez HTTPS ou localhost
- Vérifiez l'éclairage

**Jeu ne se charge pas :**
- Vérifiez que le jeu est bien enregistré dans `main.js`
- Vérifiez les imports/exports
- Consultez la console pour les erreurs

**Tailwind ne fonctionne pas :**
- Vérifiez que `npm run dev` est lancé
- Rechargez la page

## 📚 Ressources

- [Documentation P5play](https://p5play.org)
- [Documentation ML5.js](https://learn.ml5js.org)
- [Documentation Tailwind V4](https://tailwindcss.com/blog/tailwindcss-v4)
- [MakeyMakey](https://makeymakey.com)

## 🚀 Prochaines étapes

- [ ] Ajouter d'autres mini-jeux
- [ ] Implémenter le mode série (enchaînement de jeux)
- [ ] Ajouter un système de difficulté progressive
- [ ] Intégrer une base de données pour les scores
- [ ] Créer un classement en ligne

---

**Bon développement ! 🎮✨**
