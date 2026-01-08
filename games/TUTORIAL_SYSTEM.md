# 📋 Utiliser le Système de Tutoriel

Le `TutorialSystem` permet de créer des tutoriels uniformes pour tous les mini-jeux.

## 🎯 Avantages

- ✅ **Design uniforme** : Tous les tutoriels ont le même look
- ✅ **Badges automatiques** : Affichage automatique de la technologie et de l'input
- ✅ **Simple à utiliser** : Juste fournir les données, le HTML est généré
- ✅ **Maintenance facile** : Modifier le template une fois = tous les jeux sont mis à jour

## 📖 Comment utiliser

### 1. Importer le système

```javascript
import { TutorialSystem } from '../TutorialSystem.js';
```

### 2. Créer le tutoriel dans la méthode `getTutorial()`

#### Pour un jeu ML5 (Webcam)

```javascript
static getTutorial() {
    const content = TutorialSystem.generateML5Tutorial({
        title: 'Nom du jeu',
        icon: '🎮',
        objective: 'Description courte de l\'objectif principal',
        steps: [
            'Étape 1',
            'Étape 2',
            'Étape 3',
            // ...
        ],
        tip: 'Une astuce utile pour le joueur (optionnel)'
    });

    return {
        title: '🎮 Nom du jeu',
        content: content
    };
}
```

#### Pour un jeu MakeyMakey

```javascript
static getTutorial() {
    const content = TutorialSystem.generateMakeyMakeyTutorial({
        title: 'Cowboy Aim Lab',
        icon: '🤠',
        objective: 'Dégaine et tire le plus vite possible sur la cible !',
        steps: [
            'Connecte ton MakeyMakey',
            'Prépare ta gâchette (câble + objet conducteur)',
            'Touche la gâchette pour dégainer',
            'Vise et tire sur la cible',
            'Sois le plus rapide possible !'
        ],
        tip: 'Utilise un vrai pistolet en pâte à modeler pour plus d\'immersion !'
    });

    return {
        title: '🤠 Cowboy Aim Lab',
        content: content
    };
}
```

#### Pour un jeu hybride (ML5 + MakeyMakey)

```javascript
static getTutorial() {
    const content = TutorialSystem.generateHybridTutorial({
        title: 'Leak Plugger',
        icon: '💧',
        objective: 'Bouche les fuites d\'eau avec tes mains et le MakeyMakey !',
        steps: [
            'Autorise l\'accès à ta webcam',
            'Connecte ton MakeyMakey',
            'Place tes mains sur les fuites détectées par la caméra',
            'Appuie sur le patch conducteur pour boucher définitivement',
            'Ne laisse pas l\'eau déborder !'
        ],
        tip: 'Travaille en équipe : un joeur place les mains, l\'autre active le patch !'
    });

    return {
        title: '💧 Reboucher les fuites',
        content: content
    };
}
```

## 🎨 Structure des données

### Paramètres du tutoriel

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `title` | string | ✅ | Nom du jeu |
| `icon` | string | ❌ | Emoji/icône (défaut: 🎮) |
| `objective` | string | ✅ | Objectif principal du jeu |
| `steps` | array | ✅ | Liste des étapes pour jouer |
| `tip` | string | ❌ | Astuce pour le joueur |
| `technology` | string | ⚙️ | Auto (ML5, MakeyMakey, etc.) |
| `input` | string | ⚙️ | Auto (Webcam, MakeyMakey, etc.) |

> **Note :** `technology` et `input` sont automatiquement définis selon la méthode utilisée (`generateML5Tutorial`, `generateMakeyMakeyTutorial`, etc.)

## 🎨 Badges disponibles

### Technologies
- **🤖 Intelligence Artificielle** (ML5)
- **🕹️ MakeyMakey**
- **🎮 ML5 + MakeyMakey** (Hybride)

### Inputs
- **📷 Webcam Required**
- **🔌 MakeyMakey Required**
- **📷🔌 Webcam + MakeyMakey**

## 🔧 Personnalisation avancée

Si tu as besoin d'un tutoriel vraiment spécifique, tu peux utiliser la méthode `generate()` de base :

```javascript
const content = TutorialSystem.generate({
    title: 'Mon Jeu Custom',
    icon: '🚀',
    objective: 'Objectif personnalisé',
    steps: ['Étape 1', 'Étape 2'],
    tip: 'Astuce personnalisée',
    technology: 'ML5', // ou 'MakeyMakey' ou 'ML5+MakeyMakey'
    input: 'Webcam' // ou 'MakeyMakey' ou 'Both'
});
```

## ✅ Exemple complet

Voir [games/wall-shapes/WallShapesGame.js](../wall-shapes/WallShapesGame.js) pour un exemple complet d'implémentation.

## 🎨 Classes Tailwind disponibles

Le tutoriel utilise Tailwind CSS. Voici les classes principales :

- `bg-orange-50`, `border-orange-400` : Zone d'objectif
- `bg-lime-100`, `border-lime-400` : Zone d'astuce
- `bg-purple-500`, `bg-blue-500`, etc. : Badges
- `space-y-5`, `rounded-xl`, `p-4` : Espacements et styles

Toutes les classes Tailwind sont disponibles si tu veux créer du HTML custom.
