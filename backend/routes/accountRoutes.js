const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/accounts
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = `
            SELECT a.*, c.name AS customer_name, c.cust_id
            FROM account a
            LEFT JOIN account_customer ac ON a.acc_num = ac.acc_num
            LEFT JOIN customer c ON ac.cust_id = c.cust_id
        `;
        const params = [];
        if (req.user.role === 'CUSTOMER') {
            query += ' WHERE c.cust_id = ?';
            params.push(req.user.entity_id);
        }
        const [accounts] = await pool.query(query, params);
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/accounts
router.post('/', verifyToken, async (req, res) => {
    const { cust_id, branch_id, balance, acc_type, ownership_type, joint_cust_id } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [accResult] = await conn.query(
            'INSERT INTO account (branch_id, balance, acc_type, open_date, status) VALUES (?, ?, ?, NOW(), ?)',
            [branch_id, balance || 0.00, acc_type, 'active']
        );
        const accNum = accResult.insertId;

        const vpa = `acc${accNum}@finvault`;
        await conn.query('UPDATE account SET vpa = ? WHERE acc_num = ?', [vpa, accNum]);

        const primaryOwnership = ownership_type || 'primary';
        await conn.query(
            'INSERT INTO account_customer (acc_num, cust_id, ownership_type) VALUES (?, ?, ?)',
            [accNum, cust_id, primaryOwnership]
        );

        if (primaryOwnership === 'joint' && joint_cust_id) {
            await conn.query(
                'INSERT INTO account_customer (acc_num, cust_id, ownership_type) VALUES (?, ?, ?)',
                [accNum, joint_cust_id, 'joint']
            );
        }

        if (acc_type === 'savings') {
            await conn.query('INSERT INTO saving_acc (acc_num, nominee) VALUES (?, ?)', [accNum, 'None']);
        } else if (acc_type === 'current') {
            await conn.query('INSERT INTO current_acc (acc_num, business_refno) VALUES (?, ?)', [accNum, 'BIZ-' + accNum]);
        }

        await conn.commit();
        res.json({ message: 'Account created', acc_num: accNum, vpa });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

// GET /api/accounts/vpa  — all VPAs for UPI recipient selector
router.get('/vpa', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.acc_num, a.vpa, c.name AS customer_name
            FROM account a
            LEFT JOIN account_customer ac ON a.acc_num = ac.acc_num
            LEFT JOIN customer c ON ac.cust_id = c.cust_id
            WHERE a.vpa IS NOT NULL AND a.status = 'active'
            ORDER BY c.name
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/accounts/branches
router.get('/branches', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bank_branch ORDER BY branch_id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
