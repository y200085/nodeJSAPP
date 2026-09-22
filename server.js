const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Pool using environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'user_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize Database Table
async function initDB() {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                userID INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                age INT NOT NULL
            )
        `);
        connection.release();
        console.log('Database connected and table verified.');
    } catch (err) {
        console.error('Database initialization failed:', err.message);
    }
}
initDB();

// --- API ROUTES ---

// CREATE
app.post('/api/users', async (req, res) => {
    try {
        const { name, age } = req.body;
        if (!name || !age) return res.status(400).json({ error: 'Name and age are required' });
        
        const [result] = await pool.query('INSERT INTO users (name, age) VALUES (?, ?)', [name, age]);
        res.status(201).json({ userID: result.insertId, name, age });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
app.put('/api/users/:id', async (req, res) => {
    try {
        const { name, age } = req.body;
        const { id } = req.params;
        await pool.query('UPDATE users SET name = ?, age = ? WHERE userID = ?', [name, age, id]);
        res.json({ userID: id, name, age });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM users WHERE userID = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});