# ⚠️ RÉSOLUTION PROBLÈME 404 VERCEL

## Le problème
Les routes `/api/*` retournent 404 car Vercel ne détecte pas les serverless functions.

## Solution : Redéploiement

### Étape 1 : Vérifier la structure
```bash
# Assurez-vous d'avoir ces fichiers :
api/
├── package.json  ← type: "module"
├── db.js
├── leaderboard.js
├── score.js
└── player.js
```

### Étape 2 : Push les changements
```bash
git add .
git commit -m "Fix: Rename _db.js to db.js for Vercel compatibility"
git push origin main
```

### Étape 3 : Vérifier le déploiement Vercel
1. Allez sur https://vercel.com/dashboard
2. Cliquez sur votre projet `nuit-mmi`
3. Allez dans l'onglet **Functions**
4. Vous devriez voir :
   - `/api/leaderboard`
   - `/api/score`
   - `/api/player`

### Étape 4 : Tester les routes
```bash
# Test GET
curl https://nuit-mmi.vercel.app/api/leaderboard

# Test POST
curl -X POST https://nuit-mmi.vercel.app/api/score \
  -H "Content-Type: application/json" \
  -d '{"pseudo":"test","score":100}'
```

## Si ça ne fonctionne toujours pas

### Option A : Redéployer manuellement
1. Dans Vercel Dashboard > Deployments
2. Cliquez sur "Redeploy" sur le dernier déploiement
3. Cochez "Use existing build cache" = **OFF**
4. Cliquez "Redeploy"

### Option B : Vérifier les logs
1. Vercel Dashboard > Deployment
2. Onglet "Runtime Logs"
3. Cherchez les erreurs liées à `/api/*`

### Option C : Vérifier la configuration
Dans `vercel.json`, la configuration est simplifiée :
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ]
}
```

Vercel détecte automatiquement les fichiers dans `/api` comme serverless functions.

## Variables d'environnement

Vérifiez dans Settings > Environment Variables :
- `DATABASE_URL` = votre URL PostgreSQL complète
- Doit être présente pour **Production**, **Preview** et **Development**

## Checklist finale

- [ ] Fichiers dans `/api` avec `export default`
- [ ] `api/package.json` avec `"type": "module"`
- [ ] Pas de fichiers commençant par `_` (underscore)
- [ ] `DATABASE_URL` configurée dans Vercel
- [ ] Git push effectué
- [ ] Redéploiement Vercel terminé
- [ ] Onglet "Functions" montre les 3 fonctions

Une fois ces étapes complétées, les routes devraient fonctionner !
