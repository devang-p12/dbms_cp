require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── Route modules ────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const customerRoutes    = require('./routes/customerRoutes');
const accountRoutes     = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const employeeRoutes    = require('./routes/employeeRoutes');
const attendanceRoutes  = require('./routes/attendanceRoutes');
const payrollRoutes     = require('./routes/payrollRoutes');
const auditRoutes       = require('./routes/auditRoutes');

// ── Mount routes ─────────────────────────────────────────────────────────────
app.use('/api',              authRoutes);          // POST /api/login
app.use('/api/dashboard',    dashboardRoutes);     // GET  /api/dashboard
app.use('/api/customers',    customerRoutes);      // GET|POST /api/customers
app.use('/api/accounts',     accountRoutes);       // GET|POST /api/accounts, /api/accounts/vpa, /api/accounts/branches
app.use('/api/transactions', transactionRoutes);   // GET|POST /api/transactions/*
app.use('/api/employees',    employeeRoutes);      // GET  /api/employees
app.use('/api/attendance',   attendanceRoutes);    // GET|POST /api/attendance
app.use('/api/payroll',      payrollRoutes);       // GET|POST /api/payroll, /preview, /generate
app.use('/api/audit',        auditRoutes);         // GET  /api/audit

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅  FinVault API running on http://localhost:${PORT}`);
});
