const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/customers
router.get('/', verifyToken, async (req, res) => {
    try {
        const [customers] = await pool.query('SELECT * FROM customer');
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/customers
router.post('/', verifyToken, async (req, res) => {
    const { name, gender, mail_id, phone_no, pan_no, address, username: reqUsername, password: reqPassword } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            'INSERT INTO customer (name, gender, mail_id, phone_no, pan_no, address) VALUES (?, ?, ?, ?, ?, ?)',
            [name, gender, mail_id, phone_no, pan_no, address]
        );
        const custId = result.insertId;

        const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const username  = reqUsername ? reqUsername.trim() : `${firstName}${custId}`;
        const rawPassword = reqPassword ? reqPassword : (phone_no || 'Welcome@1234');
        const hashed = await bcrypt.hash(rawPassword, 10);

        const [existing] = await conn.query('SELECT user_id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({ error: `Username "${username}" is already taken. Please choose another.` });
        }

        await conn.query(
            'INSERT INTO users (username, password, role, entity_id) VALUES (?, ?, ?, ?)',
            [username, hashed, 'CUSTOMER', custId]
        );

        await conn.commit();
        res.json({
            message: 'Customer registered',
            id: custId,
            username,
            loginNote: reqPassword ? 'Password set by staff' : (phone_no ? 'Password = phone number' : 'Password = Welcome@1234')
        });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || 'Server error' });
    } finally {
        conn.release();
    }
});

module.exports = router;
