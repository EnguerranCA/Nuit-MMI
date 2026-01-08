import { Pool } from 'pg';

let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    }
    return pool;
}

export async function initDatabase() {
    const pool = getPool();
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
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        client.release();
    }
}

export async function saveScore(pseudo, score) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await initDatabase();
        
        const existing = await client.query(
            'SELECT score FROM leaderboard WHERE pseudo = $1',
            [pseudo]
        );
        
        if (existing.rows.length > 0) {
            if (score > existing.rows[0].score) {
                await client.query(
                    'UPDATE leaderboard SET score = $1, date = CURRENT_TIMESTAMP WHERE pseudo = $2',
                    [score, pseudo]
                );
                return { success: true, updated: true, oldScore: existing.rows[0].score };
            }
            return { success: true, updated: false, message: 'Score existant meilleur' };
        } else {
            await client.query(
                'INSERT INTO leaderboard (pseudo, score) VALUES ($1, $2)',
                [pseudo, score]
            );
            return { success: true, new: true };
        }
    } catch (error) {
        console.error('Error saving score:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function getLeaderboard(limit = 10) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await initDatabase();
        const result = await client.query(
            'SELECT pseudo, score, date FROM leaderboard ORDER BY score DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function getPlayerRank(pseudo) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await initDatabase();
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
        console.error('Error getting player rank:', error);
        return null;
    } finally {
        client.release();
    }
}
