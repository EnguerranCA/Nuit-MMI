import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connexion à la base de données
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Créer la table si elle n'existe pas
export async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS leaderboard (
                id SERIAL PRIMARY KEY,
                pseudo VARCHAR(50) UNIQUE NOT NULL,
                score INTEGER NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_score ON leaderboard(score DESC);
        `);
        console.log('✅ Base de données initialisée');
    } catch (error) {
        console.error('❌ Erreur initialisation BDD:', error);
    } finally {
        client.release();
    }
}

// Sauvegarder ou mettre à jour un score
export async function saveScore(pseudo, score) {
    const client = await pool.connect();
    try {
        // Vérifier si le pseudo existe déjà
        const existing = await client.query(
            'SELECT score FROM leaderboard WHERE pseudo = $1',
            [pseudo]
        );
        
        if (existing.rows.length > 0) {
            // Si le nouveau score est meilleur, on met à jour
            if (score > existing.rows[0].score) {
                await client.query(
                    'UPDATE leaderboard SET score = $1, date = CURRENT_TIMESTAMP WHERE pseudo = $2',
                    [score, pseudo]
                );
                return { success: true, updated: true, oldScore: existing.rows[0].score };
            }
            return { success: true, updated: false, message: 'Score existant meilleur' };
        } else {
            // Nouveau pseudo
            await client.query(
                'INSERT INTO leaderboard (pseudo, score) VALUES ($1, $2)',
                [pseudo, score]
            );
            return { success: true, new: true };
        }
    } catch (error) {
        console.error('❌ Erreur sauvegarde score:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// Récupérer le classement (top 10)
export async function getLeaderboard(limit = 10) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT pseudo, score, date FROM leaderboard ORDER BY score DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    } catch (error) {
        console.error('❌ Erreur récupération classement:', error);
        return [];
    } finally {
        client.release();
    }
}

// Récupérer le rang d'un pseudo
export async function getPlayerRank(pseudo) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT rank, pseudo, score FROM (
                SELECT pseudo, score, 
                       ROW_NUMBER() OVER (ORDER BY score DESC) as rank
                FROM leaderboard
            ) ranked
            WHERE pseudo = $1
        `, [pseudo]);
        
        return result.rows[0] || null;
    } catch (error) {
        console.error('❌ Erreur récupération rang:', error);
        return null;
    } finally {
        client.release();
    }
}
