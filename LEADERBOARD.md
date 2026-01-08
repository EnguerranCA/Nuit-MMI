# 🏆 Système de Classement

## Démarrage

### 1. Lancer le serveur API
```bash
npm run server
```

Le serveur démarre sur `http://localhost:3001`

### 2. Lancer le jeu (dans un autre terminal)
```bash
npm run dev
```

Le jeu démarre sur `http://localhost:3000`

### 3. Lancer les deux en même temps
```bash
npm run dev:all
```

## Base de données

### Structure
```sql
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    pseudo VARCHAR(50) UNIQUE NOT NULL,
    score INTEGER NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Règles
- Un pseudo ne peut exister qu'une seule fois
- Si un joueur rejoue avec le même pseudo, seul son meilleur score est conservé
- Le classement affiche les 20 meilleurs scores

## API Endpoints

### GET `/api/leaderboard`
Récupère le classement

**Query params:**
- `limit` (optionnel) : nombre de résultats (défaut: 10)

**Réponse:**
```json
[
  {
    "pseudo": "Player1",
    "score": 1500,
    "date": "2026-01-08T10:30:00.000Z"
  }
]
```

### POST `/api/score`
Sauvegarde un score

**Body:**
```json
{
  "pseudo": "Player1",
  "score": 1500
}
```

**Réponse:**
```json
{
  "success": true,
  "new": true  // ou "updated": true si c'est une mise à jour
}
```

### GET `/api/player/:pseudo`
Récupère le rang d'un joueur

**Réponse:**
```json
{
  "rank": 5,
  "pseudo": "Player1",
  "score": 1200
}
```

## Fonctionnalités

- ✅ Sauvegarde automatique du meilleur score par pseudo
- ✅ Classement avec animations GSAP
- ✅ Top 3 mis en évidence (or, argent, bronze)
- ✅ Page de classement accessible depuis le menu
- ✅ Input pseudo dans l'écran Game Over
- ✅ Messages de feedback (nouveau record, score existant, etc.)

## Développement

Le fichier `.env` contient la connexion à la base de données Neon PostgreSQL.

Pour modifier la base de données, éditez `server/db.js`.
