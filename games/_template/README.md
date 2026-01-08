# 🎮 Template de Mini-Jeu

Ce template fournit la structure de base pour créer un nouveau mini-jeu.

## 📋 Comment utiliser ce template

### 1. Copier le template

```bash
# Copie le dossier template
cp -r games/_template games/mon-nouveau-jeu

# Renomme le fichier
mv games/mon-nouveau-jeu/TemplateGame.js games/mon-nouveau-jeu/MonNouveauJeu.js
```

### 2. Modifier la classe

Ouvre `MonNouveauJeu.js` et :
- Renomme la classe `TemplateGame` en `MonNouveauJeu`
- Met à jour le tutoriel avec tes informations
- Implémente ta logique de jeu dans `update()`

### 3. Enregistrer dans le GameManager

Dans `main.js`, méthode `loadGames()` :

```javascript
const { MonNouveauJeu } = await import('./games/mon-nouveau-jeu/MonNouveauJeu.js');
this.registerGame('mon-nouveau-jeu', MonNouveauJeu);
```

### 4. Ajouter à la séquence

Dans `main.js`, méthode `startGameSession()` :

```javascript
this.state.gamesSequence = ['wall-shapes', 'mon-nouveau-jeu'];
```

## 🎯 Structure du jeu

### Méthodes obligatoires

- `static getTutorial()` : Retourne le tutoriel
- `async init()` : Initialise le jeu (P5.js, ressources)
- `start()` : Démarre le jeu
- `update(p)` : Boucle de jeu (appelée chaque frame)
- `cleanup()` : Nettoie les ressources

### Terminer le jeu

```javascript
// Victoire
this.end('completed', this.score);

// Défaite
this.end('failed', this.score);
```

## 📦 Ressources disponibles

### Dans BaseGame (this.)
- `gameManager` : Référence au GameManager
- `isRunning` : État du jeu
- `score` : Score actuel
- `canvas` : Canvas P5.js
- `world` : Monde P5play

### Méthodes utiles
- `addScore(points)` : Ajoute des points
- `end(reason, score)` : Termine le jeu
- `pause()` / `resume()` : Pause/Reprise

## 🎨 Couleurs Kawaii

```javascript
p.fill(255, 183, 85);  // Orange
p.fill(163, 255, 86);  // Lime
p.fill(242, 238, 229); // Beige
p.fill(0, 0, 0);       // Noir
```

## 🔧 Exemples

Consulte `games/wall-shapes/WallShapesGame.js` pour un exemple complet.

---

**Bon développement ! 🚀**
