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
├── styles.css                # Styles Tailwind V4 + Kawaii + Fonts
├── vite.config.js            # Configuration Vite
├── package.json              # Dépendances
│
└── games/                    # Dossier des mini-jeux
    ├── BaseGame.js           # Classe de base pour tous les jeux
    ├── TutorialSystem.js     # Système de tutoriel uniforme
    ├── ADDING_GAMES.md       # Guide pour ajouter des jeux
    ├── TUTORIAL_SYSTEM.md    # Guide du système de tutoriel
    │
    ├── _template/            # Template pour créer un jeu
    │   ├── TemplateGame.js
    │   └── README.md
    │
    └── wall-shapes/          # Premier mini-jeu
        └── WallShapesGame.js
```

## 🎮 Architecture

### GameManager (`main.js`)
Le cerveau du jeu qui gère :
- Chargement des mini-jeux
- Transitions entre écrans (menu, tutoriel, jeu, transition, game over)
- Score global et progression
- Séquence de jeux avec enchaînement automatique

### BaseGame (`games/BaseGame.js`)
Classe abstraite que tous les mini-jeux doivent étendre. Fournit :
- API standard (`init()`, `start()`, `update()`, `cleanup()`)
- Gestion du score
- Gestion des inputs (MakeyMakey)
- Intégration avec le GameManager
- Système de victoire/défaite avec enchaînement

### TutorialSystem (`games/TutorialSystem.js`)
Système de tutoriel réutilisable pour générer des tutoriels uniformes :
- 3 méthodes rapides : `generateML5Tutorial()`, `generateMakeyMakeyTutorial()`, `generateHybridTutorial()`
- Badges automatiques selon la technologie
- Layout responsive avec Tailwind

### Mini-jeux (`games/*/`)
Chaque mini-jeu est **totalement indépendant** dans son propre dossier.

## 🛠️ Technologies utilisées

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **Vite** | 6.0 | Build tool rapide |
| **Tailwind CSS** | V4 | Framework CSS avec couleurs Kawaii |
| **P5.js** | 1.11.4 | Librairie de dessin (compatible P5play) |
| **P5play** | v3 | Framework de jeu basé sur P5.js |
| **ML5.js** | latest | Machine Learning (détection pose/main) |
| **GSAP** | 3.12 | Animations fluides |
| **MakeyMakey** | - | Contrôleur physique (émulation clavier) |

## 🎨 Design System

### Fonts
- **Lexend** : Corps de texte (Regular, poids 300-700)
- **Outfit** : Titres et boutons (poids 400-900)

## 🎨 Palette de couleurs Kawaii

| Nom | Hex | Variable CSS | RGB |
|-----|-----|--------------|-----|
| Orange | #FFB755 | `--color-primary` | 255, 183, 85 |
| Lime | #A3FF56 | `--color-secondary` | 163, 255, 86 |
| Beige | #F2EEE5 | `--color-background` | 242, 238, 229 |
| Noir | #000000 | `--color-text` | 0, 0, 0 |

### Classes utilitaires
```css
.kawaii-bounce    /* Animation de rebond doux */
.kawaii-pulse     /* Animation de pulsation */
.font-lexend      /* Force la font Lexend */
.font-outfit      /* Force la font Outfit */
```

## 🎯 Jeux disponibles

### Wall Shapes Game (Formes dans les murs)
- **Technologie :** ML5 BodyPose
- **Input :** Webcam (détection de pose)
- **Objectif :** Reproduire la pose affichée sur le mur
- **Système :** 3 vies, 5 murs à passer
- **État :** ✅ Fonctionnel

## ➕ Créer un nouveau jeu

### Méthode rapide avec le template

1. **Copier le template** :
   ```bash
   cp -r games/_template games/mon-jeu
   ```

2. **Renommer et modifier** :
   - Renomme `TemplateGame.js` → `MonJeu.js`
   - Change le nom de classe
   - Implémente ta logique dans `update()`

3. **Enregistrer dans GameManager** (`main.js`) :
   ```javascript
   async loadGames() {
       // Jeux existants
       const { WallShapesGame } = await import('./games/wall-shapes/WallShapesGame.js');
       this.registerGame('wall-shapes', WallShapesGame);
       
       // TON NOUVEAU JEU
       const { MonJeu } = await import('./games/mon-jeu/MonJeu.js');
       this.registerGame('mon-jeu', MonJeu);
   }
   ```

4. **Ajouter à la séquence** :
   ```javascript
   startGameSession() {
       this.state.gamesSequence = ['wall-shapes', 'mon-jeu'];
   }
   ```

### Structure minimale d'un jeu

```javascript
import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

export class MonJeu extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
    }

    static getTutorial() {
        const content = TutorialSystem.generateML5Tutorial({
            title: 'Mon Jeu',
            objective: 'Objectif du jeu',
            steps: ['Étape 1', 'Étape 2'],
            tip: 'Astuce'
        });
        return { title: 'Mon Jeu', content };
    }

    async init() { /* Initialisation P5.js */ }
    start() { /* Démarrage */ }
    update(p) { /* Boucle de jeu */ }
    cleanup() { /* Nettoyage */ }
}
```

### Terminer un jeu

```javascript
// Victoire (passe au jeu suivant)
this.end('completed', this.score);

// Défaite (game over)
this.end('failed', this.score);
```

## 🎨 Utiliser GSAP pour les animations

GSAP est maintenant disponible dans tous les jeux :

```javascript
import gsap from 'gsap';

// Animation simple
gsap.to(element, { duration: 1, x: 100, opacity: 0.5 });

// Timeline
const tl = gsap.timeline();
tl.to(element, { x: 100 })
  .to(element, { y: 50 })
  .to(element, { rotation: 360 });
```

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

- [Documentation P5.js](https://p5js.org/reference/)
- [Documentation P5play](https://p5play.org)
- [Documentation ML5.js](https://learn.ml5js.org)
- [Documentation GSAP](https://gsap.com/docs/)
- [Documentation Tailwind V4](https://tailwindcss.com/blog/tailwindcss-v4)
- [MakeyMakey](https://makeymakey.com)

## 🚀 Prochaines étapes

- [ ] Ajouter d'autres mini-jeux
- [ ] Implémenter le mode série (enchaînement multiple)
- [ ] Ajouter un système de difficulté progressive
- [ ] Intégrer une base de données pour les scores
- [ ] Créer un classement en ligne

---

**Bon développement !**
