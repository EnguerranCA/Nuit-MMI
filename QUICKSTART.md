# 🎮 Compilation de Mini-Jeux MMI

**Stack :** P5play, MakeyMakey, ML5.js et Tailwind V4

Compilation de mini-jeux web dynamiques et sportifs avec une direction artistique Kawaii.

## 🚀 Démarrage rapide

```bash
# Installation
npm install

# Lancement du serveur de développement
npm run dev
```

Ouvrez votre navigateur sur `http://localhost:3000/game.html`

## 📖 Documentation

- **[Guide de développement](DEV_GUIDE.md)** - Architecture, structure et technologies
- **[Ajouter un mini-jeu](games/ADDING_GAMES.md)** - Guide complet pour créer de nouveaux jeux
- **[Concept du projet](README.md)** - Vision globale et liste des jeux prévus

## 🎯 Architecture

Le projet est conçu pour être **ultra-modulaire** :

- 🎮 **GameManager** : Gère l'enchaînement des jeux, tutoriels, transitions
- 🧩 **BaseGame** : Classe abstraite pour créer des jeux uniformes
- 📁 **Un dossier par jeu** : Développement indépendant

## 🛠️ Stack technique

| Technologie | Utilisation |
|-------------|-------------|
| **Vite** | Build tool et dev server |
| **Tailwind V4** | Style |
| **P5.js + P5play** | Moteur de jeu |
| **ML5.js** | Détection de pose/main via webcam |
| **MakeyMakey** | Inputs physiques alternatifs |

## 🎨 Mini-jeux actuels

- ✅ **Wall Shapes** - Formes dans les murs (ML5 PoseNet)
- 🔜 **Leak Plugger** - Reboucher les fuites (ML5 + MakeyMakey)
- 🔜 **Subway Runner** - Runner avec esquives (ML5)
- 🔜 **Cowboy Aim** - Dégainer le plus vite (MakeyMakey)
- 🔜 **Trombone Rhythm** - Jeu de rythme (MakeyMakey/ML5)

## 📝 Scripts disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run preview  # Preview du build
```

## 🎨 Couleurs Kawaii

- 🟠 **Orange** : `#FFB755` - Couleur primaire
- 🟢 **Lime** : `#A3FF56` - Couleur secondaire
- 🟤 **Beige** : `#F2EEE5` - Fond
- ⚫ **Noir** : `#000000` - Texte

## 📂 Structure

```
├── game.html              # Page principale
├── main.js                # GameManager
├── styles.css             # Styles Tailwind
├── vite.config.js         # Config Vite
│
└── games/                 # Mini-jeux
    ├── BaseGame.js        # Classe de base
    └── wall-shapes/       # Exemple de jeu
        └── WallShapesGame.js
```

## 🆘 Support

Consultez les guides de documentation pour toute question :
- Architecture et démarrage : `DEV_GUIDE.md`
- Création de jeux : `games/ADDING_GAMES.md`

---

**Projet MMI - 2026** 🎮✨
