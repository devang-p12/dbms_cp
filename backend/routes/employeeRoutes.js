const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');

// GET /api/employees
router.get('/', verifyToken, async (req, res) => {
    try {
        const [emps] = await pool.query('SELECT * FROM employee');
        res.json(emps);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/employees
router.post('/', verifyToken, async (req, res) => {
    // Check if requester is ADMIN
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { name, gender, designation, salary, branch_id, join_date, username, password } = req.body;
    
    if (!username || !password || !name || !branch_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Create employee
        const [empRes] = await conn.query(
            'INSERT INTO employee (name, gender, designation, salary, join_date, branch_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, gender, designation, salary, join_date || new Date(), branch_id]
        );
        const empId = empRes.insertId;

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create user
        await conn.query(
            'INSERT INTO users (username, password, role, entity_id) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, 'EMPLOYEE', empId]
        );

        await conn.commit();
        res.status(201).json({ message: 'Employee created successfully', emp_id: empId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create employee' });
        }
    } finally {
        conn.release();
    }
});

module.exports = router;

