# 🎮 Ajouter un nouveau mini-jeu

Ce guide explique comment créer un nouveau mini-jeu de manière modulaire.

## 📁 Structure d'un mini-jeu

Chaque mini-jeu doit avoir sa propre structure :

```
games/
  └── mon-nouveau-jeu/
      ├── MonNouveauJeu.js     # Classe principale du jeu
      ├── assets/              # (optionnel) Images, sons, etc.
      └── README.md            # (optionnel) Documentation du jeu
```

## 🔧 Créer un nouveau jeu

### 1. Créer le dossier

```bash
mkdir games/mon-nouveau-jeu
```

### 2. Créer la classe du jeu

Créez `MonNouveauJeu.js` en étendant `BaseGame` :

```javascript
import { BaseGame } from '../BaseGame.js';

export class MonNouveauJeu extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        // Vos variables spécifiques
    }

    /**
     * Informations du tutoriel (OBLIGATOIRE)
     */
    static getTutorial() {
        return {
            title: '🎯 Nom du jeu',
            content: `
                <div class="space-y-4">
                    <p><strong>🎯 Objectif :</strong> Description...</p>
                    <p><strong>📷 Comment jouer :</strong><br>
                    • Étape 1<br>
                    • Étape 2<br>
                    • Étape 3
                    </p>
                </div>
            `
        };
    }

    /**
     * Initialisation (OBLIGATOIRE)
     * Peut être async si vous devez charger des ressources
     */
    async init() {
        console.log('🎮 MonNouveauJeu - Initialisation');
        
        return new Promise((resolve) => {
            const sketch = (p) => {
                p.setup = () => {
                    // Création du canvas
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    
                    // Initialisation de P5play
                    this.world = new p.World();
                    
                    // Votre code d'initialisation
                    resolve();
                };

                p.draw = () => {
                    this.update(p);
                };
            };

            window.p5Instance = new p5(sketch);
        });
    }

    /**
     * Démarrage du jeu (OBLIGATOIRE)
     */
    start() {
        super.start();
        console.log('▶️ MonNouveauJeu - Démarrage');
        
        // Votre code de démarrage
    }

    /**
     * Boucle de jeu (OBLIGATOIRE)
     */
    update(p) {
        if (!this.isRunning) return;

        // Fond
        p.background(242, 238, 229);
        
        // Votre logique de jeu
        
        // Conditions de fin
        if (/* condition de défaite */) {
            this.end('failed');
        }
    }

    /**
     * Nettoyage (OBLIGATOIRE)
     */
    cleanup() {
        console.log('🧹 MonNouveauJeu - Nettoyage');
        
        // Nettoyage de vos ressources spécifiques
        
        super.cleanup();
    }
}
```

### 3. Enregistrer le jeu dans le GameManager

Modifiez `main.js`, dans la méthode `loadGames()` :

```javascript
async loadGames() {
    try {
        // Jeux existants
        const { WallShapesGame } = await import('./games/wall-shapes/WallShapesGame.js');
        this.registerGame('wall-shapes', WallShapesGame);
        
        // AJOUTEZ VOTRE JEU ICI
        const { MonNouveauJeu } = await import('./games/mon-nouveau-jeu/MonNouveauJeu.js');
        this.registerGame('mon-nouveau-jeu', MonNouveauJeu);
        
        console.log('✅ Mini-jeux chargés:', Object.keys(this.gamesRegistry));
    } catch (error) {
        console.error('❌ Erreur de chargement des jeux:', error);
    }
}
```

### 4. Ajouter le jeu à la séquence

Dans `startGameSession()` de `main.js` :

```javascript
startGameSession() {
    // ...
    
    // Ajoutez votre jeu à la séquence
    this.state.gamesSequence = ['wall-shapes', 'mon-nouveau-jeu'];
    
    // ...
}
```

## 📋 API BaseGame

Votre jeu hérite de ces méthodes :

### Méthodes obligatoires à implémenter

- `static getTutorial()` - Retourne les infos du tutoriel
- `async init()` - Initialise le jeu
- `start()` - Démarre le jeu
- `update(p)` - Boucle de jeu (appelée à chaque frame)
- `cleanup()` - Nettoie les ressources

### Méthodes disponibles

- `addScore(points)` - Ajoute des points au score
- `end(reason)` - Termine le jeu
- `pause()` - Met le jeu en pause
- `resume()` - Reprend le jeu
- `onKeyPressed(key)` - Gère les inputs clavier/MakeyMakey

### Propriétés disponibles

- `this.gameManager` - Référence au GameManager
- `this.isRunning` - État du jeu (true/false)
- `this.score` - Score du jeu
- `this.canvas` - Canvas P5.js
- `this.world` - Monde P5play

## 🎨 Utiliser ML5

### PoseNet (détection de pose)

```javascript
async init() {
    return new Promise((resolve) => {
        const sketch = (p) => {
            p.setup = () => {
                // ... canvas setup ...
                
                // Webcam
                this.videoCapture = p.createCapture(p.VIDEO);
                this.videoCapture.hide();
                
                // PoseNet
                this.poseNet = ml5.poseNet(this.videoCapture, () => {
                    console.log('✅ PoseNet chargé');
                    resolve();
                });
                
                this.poseNet.on('pose', (results) => {
                    this.poses = results;
                });
            };
        };
        
        window.p5Instance = new p5(sketch);
    });
}
```

### HandPose (détection de main)

```javascript
this.handPose = ml5.handpose(this.videoCapture, () => {
    console.log('✅ HandPose chargé');
    resolve();
});

this.handPose.on('predict', (results) => {
    this.hands = results;
});
```

## 🕹️ Utiliser MakeyMakey

MakeyMakey émule des touches clavier. Utilisez `onKeyPressed()` :

```javascript
onKeyPressed(key) {
    switch(key) {
        case 'ArrowUp':
        case 'w':
            this.player.moveUp();
            break;
        case 'ArrowLeft':
        case 'a':
            this.player.moveLeft();
            break;
        // ... etc
    }
}
```

## 🎨 Couleurs Kawaii

Utilisez les couleurs définies dans Tailwind :

```javascript
p.fill(255, 183, 85);  // Orange: #FFB755
p.fill(163, 255, 86);  // Lime: #A3FF56
p.fill(242, 238, 229); // Beige: #F2EEE5
p.fill(0, 0, 0);       // Noir: #000000
```

Ou en CSS (dans le HTML) :
- `bg-[var(--color-primary)]` - Orange
- `bg-[var(--color-secondary)]` - Lime
- `bg-[var(--color-background)]` - Beige
- `text-[var(--color-text)]` - Noir

## ✅ Checklist

Avant de finaliser votre jeu :

- [ ] Le jeu étend `BaseGame`
- [ ] `getTutorial()` retourne les bonnes infos
- [ ] `init()` crée le canvas correctement
- [ ] `update()` gère la logique du jeu
- [ ] `cleanup()` nettoie toutes les ressources
- [ ] Le jeu appelle `this.end()` en cas de défaite
- [ ] Le jeu appelle `this.addScore()` pour ajouter des points
- [ ] Le jeu est enregistré dans `main.js`
- [ ] Les inputs (MakeyMakey/ML5) fonctionnent
- [ ] Le style respecte la charte Kawaii

## 📝 Exemple complet

Consultez `games/wall-shapes/WallShapesGame.js` pour un exemple complet d'implémentation.

## 🆘 Aide

Si vous avez des questions ou des problèmes :
1. Vérifiez les logs de la console (F12)
2. Assurez-vous que toutes les méthodes obligatoires sont implémentées
3. Vérifiez que le jeu est bien enregistré dans `main.js`
4. Testez avec `npm run dev`
