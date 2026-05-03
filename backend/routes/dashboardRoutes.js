const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', verifyToken, async (req, res) => {
    try {
        let stats = {};
        let recentTransactions = [];

        if (req.user.role === 'ADMIN' || req.user.role === 'EMPLOYEE') {
            const [[{ totalCust }]] = await pool.query('SELECT COUNT(*) AS totalCust FROM customer');
            const [[{ totalAcc }]]  = await pool.query('SELECT COUNT(*) AS totalAcc FROM account');
            const [[{ totalBal }]]  = await pool.query('SELECT SUM(balance) AS totalBal FROM account');
            const [[{ totalEmp }]]  = await pool.query('SELECT COUNT(*) AS totalEmp FROM employee');
            stats = { totalCustomers: totalCust, totalAccounts: totalAcc, totalBalance: totalBal || 0, totalEmployees: totalEmp };
            const [txns] = await pool.query(`
                SELECT t.*, IF(t.type = 'deposit' OR (t.type IN ('upi', 'transfer') AND u.trans_id IS NULL), 1, 0) AS is_credit
                FROM transaction_tbl t LEFT JOIN upi_transfer u ON t.id = u.trans_id
                ORDER BY t.timestamp DESC LIMIT 5
            `);
            recentTransactions = txns.map(t => ({...t, is_credit: !!t.is_credit}));
        } else if (req.user.role === 'CUSTOMER') {
            const [accounts] = await pool.query(
                'SELECT a.* FROM account a JOIN account_customer ac ON a.acc_num = ac.acc_num WHERE ac.cust_id = ?',
                [req.user.entity_id]
            );
            const accNums = accounts.map(a => a.acc_num);
            const totalBal = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
            stats = { totalAccounts: accounts.length, totalBalance: totalBal, accounts };
            if (accNums.length > 0) {
                const [txns] = await pool.query(`
                    SELECT t.*, IF(t.type = 'deposit' OR (t.type IN ('upi', 'transfer') AND u.trans_id IS NULL), 1, 0) AS is_credit
                    FROM transaction_tbl t LEFT JOIN upi_transfer u ON t.id = u.trans_id
                    WHERE t.acc_num IN (?) ORDER BY t.timestamp DESC LIMIT 5`,
                    [accNums]
                );
                recentTransactions = txns.map(t => ({...t, is_credit: !!t.is_credit}));
            }
        }
        res.json({ stats, recentTransactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
