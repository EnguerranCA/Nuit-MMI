import { saveScore } from './db.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pseudo, score } = req.body;

    if (!pseudo || typeof score !== 'number') {
        return res.status(400).json({ error: 'Pseudo et score requis' });
    }

    const result = await saveScore(pseudo, score);
    res.status(200).json(result);
}
