const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// POST /api/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.user_id, role: user.role, entity_id: user.entity_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        await pool.query(
            'INSERT INTO audit_log (user_id, username, action, detail, ip_addr) VALUES (?, ?, ?, ?, ?)',
            [user.user_id, user.username, 'LOGIN', 'Successful login', req.ip]
        );

        res.json({ token, user: { id: user.user_id, username: user.username, role: user.role, entity_id: user.entity_id } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/users - Create User (Admin only)
router.post('/users', verifyToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { username, password, role, entity_id } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password and role are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, password, role, entity_id) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, role, entity_id || null]
        );
        
        await pool.query(
            'INSERT INTO audit_log (user_id, username, action, detail, ip_addr) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, req.user.username, 'CREATE_USER', `Created user ${username} with role ${role}`, req.ip]
        );

        res.status(201).json({ message: 'User created successfully', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

