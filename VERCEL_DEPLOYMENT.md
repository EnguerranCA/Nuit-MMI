# Guide de déploiement sur Vercel

## Architecture

### Frontend (Vite - Static)
- Build avec `npm run build`
- Fichiers dans `/dist`
- Hébergé en tant que site statique

### Backend (Serverless Functions)
- Fonctions serverless dans `/api`
- Endpoints :
  - `GET /api/leaderboard` - Récupérer le classement
  - `POST /api/score` - Sauvegarder un score
  - `GET /api/player?pseudo=xxx` - Récupérer le rang d'un joueur

## Étapes de déploiement

### 1. Préparer le projet
```bash
# Vérifier que le build fonctionne
npm run build

# Tester localement le build
npm run preview
```

### 2. Push sur GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 3. Configurer Vercel

1. Connectez-vous sur [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez votre repository GitHub
4. Vercel détecte automatiquement Vite

### 4. Ajouter les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables :
- **Nom** : `DATABASE_URL`
- **Valeur** : `postgresql://neondb_owner:npg_Ki2TfYP8yzLv@ep-cool-heart-agfgpkrx-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
- **Environnement** : Production, Preview, Development

### 5. Déployer
Cliquez sur "Deploy" - Vercel va :
1. Builder le frontend avec Vite
2. Déployer les serverless functions
3. Connecter à la base de données PostgreSQL

## Détection automatique de l'API

Le code détecte automatiquement l'environnement :
```javascript
// En local : http://localhost:3001/api
// En prod : https://votre-app.vercel.app/api
this.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : '/api';
```

## Test du déploiement

1. Ouvrez l'URL Vercel : `https://votre-app.vercel.app`
2. Testez le jeu
3. Testez la sauvegarde du score
4. Vérifiez le classement

## Développement local

### Avec le serveur Express (recommandé en dev)
```bash
# Terminal 1
npm run server

# Terminal 2  
npm run dev
```

### Avec les fonctions serverless (test de production)
```bash
# Installer Vercel CLI
npm i -g vercel

# Lancer en mode dev
vercel dev
```

## Commandes utiles

- `npm run build` : Build de production
- `npm run preview` : Prévisualisation du build
- `vercel` : Déploiement preview
- `vercel --prod` : Déploiement production
- `vercel logs` : Voir les logs

## Troubleshooting

### Erreur de connexion base de données
Vérifiez que `DATABASE_URL` est bien configurée dans Vercel

### API ne répond pas
1. Vérifiez les logs : `vercel logs`
2. Testez l'endpoint : `curl https://votre-app.vercel.app/api/leaderboard`

### Build échoue
1. Vérifiez que `npm run build` fonctionne en local
2. Consultez les logs de build dans Vercel

## URLs après déploiement

- **Jeu** : `https://votre-projet.vercel.app`
- **Classement** : `https://votre-projet.vercel.app/api/leaderboard`
- **Score** : `POST https://votre-projet.vercel.app/api/score`
