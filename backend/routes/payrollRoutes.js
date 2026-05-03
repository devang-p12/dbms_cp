const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// ── Helpers ──────────────────────────────────────────────────────────────────
function workingDaysInMonth(year, month) {
    const days = new Date(year, month, 0).getDate();
    let count = 0;
    for (let d = 1; d <= days; d++) {
        if (new Date(year, month - 1, d).getDay() !== 0) count++; // exclude Sundays
    }
    return count;
}

function calcEarnedDays(attendanceRows, year, month) {
    return attendanceRows.reduce((sum, r) => {
        const d = new Date(r.date + 'T00:00:00');
        if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return sum;
        if (r.status === 'present' || r.status === 'holiday') return sum + 1;
        if (r.status === 'half_day') return sum + 0.5;
        return sum;
    }, 0);
}

// GET /api/payroll
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = `
            SELECT p.*, e.name, e.designation
            FROM payroll p JOIN employee e ON p.emp_id = e.emp_id
        `;
        const params = [];
        if (req.user.role === 'EMPLOYEE') {
            query += ' WHERE p.emp_id = ?';
            params.push(req.user.entity_id);
        }
        query += ' ORDER BY year DESC, month DESC';
        const [payroll] = await pool.query(query, params);
        res.json(payroll);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/payroll/preview
router.post('/preview', verifyToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'month and year required' });

    try {
        const [employees] = await pool.query('SELECT emp_id, name, designation, salary FROM employee WHERE is_active = 1');
        const [attendance] = await pool.query(
            'SELECT emp_id, date, status FROM attendance WHERE MONTH(date) = ? AND YEAR(date) = ?',
            [month, year]
        );
        const [existing] = await pool.query('SELECT emp_id FROM payroll WHERE month = ? AND year = ?', [month, year]);
        const existingIds = new Set(existing.map(r => r.emp_id));
        const workDays = workingDaysInMonth(parseInt(year), parseInt(month));

        const preview = employees.map(emp => {
            const empAtt = attendance.filter(a => a.emp_id === emp.emp_id);
            const earnedDays = calcEarnedDays(empAtt, parseInt(year), parseInt(month));
            const netSalary = workDays > 0 ? parseFloat(((emp.salary * earnedDays) / workDays).toFixed(2)) : 0;
            return {
                emp_id: emp.emp_id, name: emp.name, designation: emp.designation,
                base_salary: emp.salary, workDays, earnedDays,
                presentDays: empAtt.filter(a => a.status === 'present').length,
                halfDays:    empAtt.filter(a => a.status === 'half_day').length,
                absentDays:  empAtt.filter(a => a.status === 'absent').length,
                leaveDays:   empAtt.filter(a => a.status === 'leave').length,
                holidayDays: empAtt.filter(a => a.status === 'holiday').length,
                netSalary,
                alreadyGenerated: existingIds.has(emp.emp_id)
            };
        });

        res.json({ month, year, workDays, preview });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/payroll/generate
router.post('/generate', verifyToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'month and year required' });

    try {
        const [employees] = await pool.query('SELECT emp_id, name, salary FROM employee WHERE is_active = 1');
        const [attendance] = await pool.query(
            'SELECT emp_id, date, status FROM attendance WHERE MONTH(date) = ? AND YEAR(date) = ?',
            [month, year]
        );
        const workDays = workingDaysInMonth(parseInt(year), parseInt(month));
        const paidOn = new Date().toISOString().split('T')[0];
        let generated = 0;

        for (const emp of employees) {
            const empAtt = attendance.filter(a => a.emp_id === emp.emp_id);
            const earnedDays = calcEarnedDays(empAtt, parseInt(year), parseInt(month));
            const netSalary = workDays > 0 ? parseFloat(((emp.salary * earnedDays) / workDays).toFixed(2)) : 0;

            const [existing] = await pool.query(
                'SELECT payroll_id FROM payroll WHERE emp_id = ? AND month = ? AND year = ?',
                [emp.emp_id, month, year]
            );
            if (existing.length > 0) {
                await pool.query('UPDATE payroll SET net_salary = ?, paid_on = ? WHERE payroll_id = ?',
                    [netSalary, paidOn, existing[0].payroll_id]);
            } else {
                await pool.query('INSERT INTO payroll (emp_id, month, year, net_salary, paid_on) VALUES (?, ?, ?, ?, ?)',
                    [emp.emp_id, month, year, netSalary, paidOn]);
            }
            generated++;
        }

        await pool.query('INSERT INTO audit_log (user_id, username, action, detail) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.username, 'PAYROLL_GENERATE', `Generated payroll for ${month}/${year} — ${generated} employees`]);

        res.json({ message: `Payroll generated for ${generated} employees`, month, year });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
