const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// POST /api/attendance  — mark/update a record
router.post('/', verifyToken, async (req, res) => {
    const { emp_id, status, date: reqDate } = req.body;
    try {
        const date = reqDate || new Date().toISOString().split('T')[0];
        if (!emp_id || !status) return res.status(400).json({ error: 'emp_id and status are required' });

        await pool.query(
            'INSERT INTO attendance (emp_id, date, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
            [emp_id, date, status, status]
        );
        res.json({ message: 'Attendance marked', emp_id, date, status });
    } catch (err) {
        console.error('Attendance error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance  — employee sees own; admin can filter by ?emp_id=
router.get('/', verifyToken, async (req, res) => {
    try {
        let empId;
        if (req.user.role === 'EMPLOYEE') {
            empId = req.user.entity_id;
        } else if (req.user.role === 'ADMIN') {
            empId = req.query.emp_id || null;
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        let query = `
            SELECT a.*, e.name, e.designation
            FROM attendance a
            JOIN employee e ON a.emp_id = e.emp_id
        `;
        const params = [];
        if (empId) {
            query += ' WHERE a.emp_id = ?';
            params.push(empId);
        }
        query += ' ORDER BY a.date DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
