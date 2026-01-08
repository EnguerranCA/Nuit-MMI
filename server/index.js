import express from 'express';
import cors from 'cors';
import { initDatabase, saveScore, getLeaderboard, getPlayerRank } from './db.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialiser la BDD au démarrage
await initDatabase();

// Routes

// GET /api/leaderboard - Récupérer le classement
app.get('/api/leaderboard', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await getLeaderboard(limit);
    res.json(leaderboard);
});

// POST /api/score - Sauvegarder un score
app.post('/api/score', async (req, res) => {
    const { pseudo, score } = req.body;
    
    if (!pseudo || typeof score !== 'number') {
        return res.status(400).json({ error: 'Pseudo et score requis' });
    }
    
    const result = await saveScore(pseudo, score);
    res.json(result);
});

// GET /api/player/:pseudo - Récupérer le rang d'un joueur
app.get('/api/player/:pseudo', async (req, res) => {
    const { pseudo } = req.params;
    const player = await getPlayerRank(pseudo);
    
    if (player) {
        res.json(player);
    } else {
        res.status(404).json({ error: 'Joueur non trouvé' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
});
