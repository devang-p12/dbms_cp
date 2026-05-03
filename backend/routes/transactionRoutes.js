const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// POST /api/transactions/deposit
router.post('/deposit', verifyToken, async (req, res) => {
    const { acc_num, amount } = req.body;
    try {
        const [acc] = await pool.query('SELECT balance FROM account WHERE acc_num = ?', [acc_num]);
        if (acc.length === 0) return res.status(404).json({ error: 'Account not found' });

        await pool.query('UPDATE account SET balance = balance + ? WHERE acc_num = ?', [amount, acc_num]);
        await pool.query('INSERT INTO transaction_tbl (acc_num, amount, type, status) VALUES (?, ?, ?, ?)', [acc_num, amount, 'deposit', 'success']);
        await pool.query('INSERT INTO audit_log (user_id, username, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.username, 'TXN_DEPOSIT', `Deposited ₹${amount} in ACC:${acc_num}`]);

        res.json({ message: 'Deposit successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/transactions/withdraw
router.post('/withdraw', verifyToken, async (req, res) => {
    const { acc_num, amount } = req.body;
    try {
        const [acc] = await pool.query('SELECT balance FROM account WHERE acc_num = ?', [acc_num]);
        if (acc.length === 0) return res.status(404).json({ error: 'Account not found' });
        if (acc[0].balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        await pool.query('UPDATE account SET balance = balance - ? WHERE acc_num = ?', [amount, acc_num]);
        await pool.query('INSERT INTO transaction_tbl (acc_num, amount, type, status) VALUES (?, ?, ?, ?)', [acc_num, amount, 'withdrawal', 'success']);
        await pool.query('INSERT INTO audit_log (user_id, username, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.username, 'TXN_WITHDRAW', `Withdrew ₹${amount} from ACC:${acc_num}`]);

        res.json({ message: 'Withdrawal successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/transactions/upi
router.post('/upi', verifyToken, async (req, res) => {
    const { acc_num, amount, vpa } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [[sender]] = await conn.query('SELECT balance, acc_num FROM account WHERE acc_num = ? FOR UPDATE', [acc_num]);
        if (!sender) return res.status(404).json({ error: 'Sender account not found' });
        if (Number(sender.balance) < Number(amount)) return res.status(400).json({ error: 'Insufficient balance' });

        const [[recipient]] = await conn.query('SELECT acc_num FROM account WHERE vpa = ? AND status = ? FOR UPDATE', [vpa, 'active']);
        if (!recipient) {
            await conn.rollback();
            return res.status(404).json({ error: `No active account found for VPA: ${vpa}` });
        }
        if (String(recipient.acc_num) === String(acc_num)) {
            await conn.rollback();
            return res.status(400).json({ error: 'Cannot transfer to your own account' });
        }

        await conn.query('UPDATE account SET balance = balance - ? WHERE acc_num = ?', [amount, acc_num]);
        await conn.query('UPDATE account SET balance = balance + ? WHERE acc_num = ?', [amount, recipient.acc_num]);

        const [r] = await conn.query('INSERT INTO transaction_tbl (acc_num, amount, type, status) VALUES (?, ?, ?, ?)', [acc_num, amount, 'upi', 'success']);
        await conn.query('INSERT INTO transaction_tbl (acc_num, amount, type, status) VALUES (?, ?, ?, ?)', [recipient.acc_num, amount, 'upi', 'success']);
        await conn.query('INSERT INTO upi_transfer (trans_id, vpa, ref_no) VALUES (?, ?, ?)', [r.insertId, vpa, `UPI${Date.now()}`]);

        await conn.commit();
        res.json({ message: `₹${amount} sent successfully to ${vpa}`, ref: `UPI${Date.now()}` });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// POST /api/transactions/atm
router.post('/atm', verifyToken, async (req, res) => {
    const { acc_num, amount, card_no, atm_id, atm_pin } = req.body;
    try {
        const [acc] = await pool.query('SELECT balance, atm_pin FROM account WHERE acc_num = ?', [acc_num]);
        if (acc.length === 0) return res.status(404).json({ error: 'Account not found' });
        if (!atm_pin || atm_pin !== acc[0].atm_pin) return res.status(401).json({ error: 'Invalid ATM PIN. Transaction declined.' });
        if (acc[0].balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        const flagged = amount > 50000;
        if (!flagged) {
            await pool.query('UPDATE account SET balance = balance - ? WHERE acc_num = ?', [amount, acc_num]);
        }

        const [r] = await pool.query(
            'INSERT INTO transaction_tbl (acc_num, amount, type, status, flagged, flag_reason) VALUES (?, ?, ?, ?, ?, ?)',
            [acc_num, amount, 'atm', flagged ? 'pending' : 'success', flagged, flagged ? 'High value ATM withdrawal' : null]
        );
        await pool.query('INSERT INTO atm_transfer (trans_id, atm_id, card_no) VALUES (?, ?, ?)', [r.insertId, atm_id || 'LOCAL-ATM', card_no]);

        res.json({ message: flagged ? 'Transaction flagged for review' : 'ATM Withdrawal successful', flagged });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/transactions/card
router.post('/card', verifyToken, async (req, res) => {
    const { acc_num, amount, merch_id, card_last4 } = req.body;
    try {
        const [acc] = await pool.query('SELECT balance FROM account WHERE acc_num = ?', [acc_num]);
        if (acc.length === 0) return res.status(404).json({ error: 'Account not found' });
        if (acc[0].balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        await pool.query('UPDATE account SET balance = balance - ? WHERE acc_num = ?', [amount, acc_num]);
        const [r] = await pool.query('INSERT INTO transaction_tbl (acc_num, amount, type, status) VALUES (?, ?, ?, ?)', [acc_num, amount, 'card', 'success']);
        await pool.query('INSERT INTO card_transfer (trans_id, merch_id, card_last4) VALUES (?, ?, ?)', [r.insertId, merch_id || 'MERCH', card_last4]);

        res.json({ message: 'Card Payment successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/transactions/transfer  (internal fund transfer)
router.post('/transfer', verifyToken, async (req, res) => {
    const { from_acc, to_acc, amount } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[fromAcc]] = await conn.query('SELECT balance FROM account WHERE acc_num = ? FOR UPDATE', [from_acc]);
        if (fromAcc.balance < amount) {
            await conn.rollback();
            return res.status(400).json({ error: 'Insufficient balance in source account' });
        }

        await conn.query('UPDATE account SET balance = balance - ? WHERE acc_num = ?', [amount, from_acc]);
        await conn.query('UPDATE account SET balance = balance + ? WHERE acc_num = ?', [amount, to_acc]);

        const [txn] = await conn.query('INSERT INTO transaction_tbl (acc_num, amount, status, type) VALUES (?, ?, ?, ?)', [from_acc, amount, 'success', 'transfer']);
        await conn.query('INSERT INTO transaction_tbl (acc_num, amount, status, type) VALUES (?, ?, ?, ?)', [to_acc, amount, 'success', 'transfer']);
        await conn.query('INSERT INTO upi_transfer (trans_id, vpa, ref_no) VALUES (?, ?, ?)', [txn.insertId, to_acc + '@bank', 'TRF' + Date.now()]);

        await conn.commit();
        res.json({ message: 'Transferred successfully' });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

// GET /api/transactions
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = `
            SELECT t.*, IF(t.type = 'deposit' OR (t.type IN ('upi', 'transfer') AND u.trans_id IS NULL), 1, 0) AS is_credit
            FROM transaction_tbl t LEFT JOIN upi_transfer u ON t.id = u.trans_id
            ORDER BY t.timestamp DESC
        `;
        let params = [];
        if (req.user.role === 'CUSTOMER') {
            const [accounts] = await pool.query('SELECT acc_num FROM account_customer WHERE cust_id = ?', [req.user.entity_id]);
            const accNums = accounts.map(a => a.acc_num);
            if (accNums.length === 0) return res.json([]);
            query = `
                SELECT t.*, IF(t.type = 'deposit' OR (t.type IN ('upi', 'transfer') AND u.trans_id IS NULL), 1, 0) AS is_credit
                FROM transaction_tbl t LEFT JOIN upi_transfer u ON t.id = u.trans_id
                WHERE t.acc_num IN (?)
                ORDER BY t.timestamp DESC
            `;
            params = [accNums];
        }   
        const [txns] = await pool.query(query, params);
        const formatted = txns.map(t => ({...t, is_credit: !!t.is_credit}));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
