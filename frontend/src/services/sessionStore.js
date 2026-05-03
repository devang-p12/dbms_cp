/**
 * sessionStore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a complete in-memory + sessionStorage-backed mock database.
 * Used automatically when the backend is unreachable (network / CORS errors).
 *
 * The store replicates all API endpoints used across the frontend so that the
 * app is fully functional as a demo without a running backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
    OFFLINE:      'finvault_offline_mode',   // boolean flag
    USER:         'user',                    // current logged-in user (shared with live mode)
    TOKEN:        'token',                   // JWT placeholder
    CUSTOMERS:    'finvault_customers',
    ACCOUNTS:     'finvault_accounts',
    TRANSACTIONS: 'finvault_transactions',
    EMPLOYEES:    'finvault_employees',
    ATTENDANCE:   'finvault_attendance',
    AUDIT:        'finvault_audit',
};

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_CUSTOMERS = [
    { cust_id: 1, name: 'Arjun Sharma',   email: 'arjun@demo.in',  phone: '9876543210', dob: '1990-04-12', address: 'Mumbai, MH',  pan: 'ABCPS1234D', aadhaar: '123456789012', kyc_status: 'verified' },
    { cust_id: 2, name: 'Priya Patel',    email: 'priya@demo.in',  phone: '9812345678', dob: '1993-07-22', address: 'Pune, MH',    pan: 'DEFPP5678E', aadhaar: '234567890123', kyc_status: 'verified' },
    { cust_id: 3, name: 'Rohan Mehta',    email: 'rohan@demo.in',  phone: '9901234567', dob: '1988-01-05', address: 'Delhi, DL',   pan: 'GHIRM9012F', aadhaar: '345678901234', kyc_status: 'pending'  },
    { cust_id: 4, name: 'Kavya Nair',     email: 'kavya@demo.in',  phone: '9823456789', dob: '1995-11-18', address: 'Kochi, KL',   pan: 'JKLKN3456G', aadhaar: '456789012345', kyc_status: 'verified' },
    { cust_id: 5, name: 'Demo Customer',  email: 'demo@demo.in',   phone: '9800000001', dob: '1992-06-15', address: 'Bangalore, KA', pan: 'MNODE0001H', aadhaar: '567890123456', kyc_status: 'verified' },
];

const SEED_ACCOUNTS = [
    { acc_num: 10001, cust_id: 1, customer_name: 'Arjun Sharma',  acc_type: 'savings',  balance: 125000.00, status: 'active',   vpa: 'arjun@finvault',  ifsc: 'FINV0000001', branch: 'Mumbai Main' },
    { acc_num: 10002, cust_id: 2, customer_name: 'Priya Patel',   acc_type: 'savings',  balance: 87500.50,  status: 'active',   vpa: 'priya@finvault',  ifsc: 'FINV0000001', branch: 'Pune Branch'  },
    { acc_num: 10003, cust_id: 3, customer_name: 'Rohan Mehta',   acc_type: 'current',  balance: 340000.00, status: 'active',   vpa: 'rohan@finvault',  ifsc: 'FINV0000002', branch: 'Delhi Branch' },
    { acc_num: 10004, cust_id: 4, customer_name: 'Kavya Nair',    acc_type: 'savings',  balance: 52000.75,  status: 'active',   vpa: 'kavya@finvault',  ifsc: 'FINV0000003', branch: 'Kochi Branch' },
    { acc_num: 10005, cust_id: 5, customer_name: 'Demo Customer', acc_type: 'savings',  balance: 50000.00,  status: 'active',   vpa: 'demo@finvault',   ifsc: 'FINV0000001', branch: 'Mumbai Main'  },
];

const now = () => new Date().toISOString().replace('T', ' ').substring(0, 19);
const daysAgo = (d) => {
    const dt = new Date(); dt.setDate(dt.getDate() - d);
    return dt.toISOString().replace('T', ' ').substring(0, 19);
};

const SEED_TRANSACTIONS = [
    { id: 1, acc_num: 10001, type: 'deposit',  amount: 50000, is_credit: true,  status: 'success', timestamp: daysAgo(6), description: 'Initial deposit'        },
    { id: 2, acc_num: 10001, type: 'withdraw', amount: 5000,  is_credit: false, status: 'success', timestamp: daysAgo(5), description: 'ATM withdrawal'          },
    { id: 3, acc_num: 10002, type: 'deposit',  amount: 87500, is_credit: true,  status: 'success', timestamp: daysAgo(4), description: 'Salary credit'           },
    { id: 4, acc_num: 10001, type: 'transfer', amount: 10000, is_credit: false, status: 'success', timestamp: daysAgo(3), description: 'Transfer to ACC #10002'  },
    { id: 5, acc_num: 10002, type: 'transfer', amount: 10000, is_credit: true,  status: 'success', timestamp: daysAgo(3), description: 'Transfer from ACC #10001'},
    { id: 6, acc_num: 10003, type: 'deposit',  amount: 200000,is_credit: true,  status: 'success', timestamp: daysAgo(2), description: 'Business income'         },
    { id: 7, acc_num: 10001, type: 'upi',      amount: 2000,  is_credit: false, status: 'success', timestamp: daysAgo(1), description: 'UPI payment'             },
    { id: 8, acc_num: 10005, type: 'deposit',  amount: 50000, is_credit: true,  status: 'success', timestamp: daysAgo(0), description: 'Welcome bonus'           },
];

const SEED_EMPLOYEES = [
    { emp_id: 1, name: 'Kavya Nair',    email: 'kavya.nair@finvault.in',   phone: '9823456780', role: 'EMPLOYEE', designation: 'Relationship Manager', department: 'Retail', salary: 45000, join_date: '2022-06-01' },
    { emp_id: 2, name: 'Admin User',    email: 'admin@finvault.in',         phone: '9800000000', role: 'ADMIN',    designation: 'Branch Manager',        department: 'Admin',  salary: 85000, join_date: '2020-01-01' },
];

const SEED_ATTENDANCE = [
    { att_id: 1, emp_id: 1, date: daysAgo(1).substring(0, 10), status: 'present', check_in: '09:05', check_out: '18:10' },
    { att_id: 2, emp_id: 1, date: daysAgo(2).substring(0, 10), status: 'present', check_in: '09:00', check_out: '18:00' },
    { att_id: 3, emp_id: 1, date: daysAgo(3).substring(0, 10), status: 'absent',  check_in: null,    check_out: null    },
    { att_id: 4, emp_id: 2, date: daysAgo(1).substring(0, 10), status: 'present', check_in: '08:45', check_out: '19:00' },
];

const SEED_AUDIT = [
    { audit_id: 1, username: 'admin',        action: 'LOGIN',    detail: 'Admin logged in',               ip_addr: '127.0.0.1', timestamp: daysAgo(1) },
    { audit_id: 2, username: 'kavya.nair',   action: 'DEPOSIT',  detail: 'Deposited ₹87500 to ACC#10002', ip_addr: '127.0.0.1', timestamp: daysAgo(4) },
    { audit_id: 3, username: 'arjun.sharma', action: 'TRANSFER', detail: 'Transfer ₹10000 → ACC#10002',   ip_addr: '127.0.0.1', timestamp: daysAgo(3) },
    { audit_id: 4, username: 'arjun.sharma', action: 'UPI',      detail: 'UPI ₹2000 via finvault',        ip_addr: '127.0.0.1', timestamp: daysAgo(1) },
];

// Demo credentials map  →  { role, cust_id?, emp_id? }
const DEMO_USERS = {
    'arjun.sharma': { password: 'password123', role: 'CUSTOMER', user_id: 3, cust_id: 1, username: 'arjun.sharma', name: 'Arjun Sharma'  },
    'kavya.nair':   { password: 'password123', role: 'EMPLOYEE', user_id: 2, emp_id:  1, username: 'kavya.nair',   name: 'Kavya Nair'    },
    'admin':        { password: 'password123', role: 'ADMIN',    user_id: 1,             username: 'admin',         name: 'Admin User'    },
    'demo':         { password: 'demo',        role: 'CUSTOMER', user_id: 4, cust_id: 5, username: 'demo',          name: 'Demo Customer' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function ss(key, fallback = null) {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

function ssSave(key, val) {
    try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

function nextId(arr, field = 'id') {
    return arr.length === 0 ? 1 : Math.max(...arr.map(r => r[field] || 0)) + 1;
}

// ── Initialise store from seed data (only once per session) ──────────────────
function initStore() {
    if (!ss(KEYS.CUSTOMERS))    ssSave(KEYS.CUSTOMERS,    SEED_CUSTOMERS);
    if (!ss(KEYS.ACCOUNTS))     ssSave(KEYS.ACCOUNTS,     SEED_ACCOUNTS);
    if (!ss(KEYS.TRANSACTIONS)) ssSave(KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    if (!ss(KEYS.EMPLOYEES))    ssSave(KEYS.EMPLOYEES,    SEED_EMPLOYEES);
    if (!ss(KEYS.ATTENDANCE))   ssSave(KEYS.ATTENDANCE,   SEED_ATTENDANCE);
    if (!ss(KEYS.AUDIT))        ssSave(KEYS.AUDIT,        SEED_AUDIT);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns true when the app is running in offline/demo mode */
export function isOffline() {
    return sessionStorage.getItem(KEYS.OFFLINE) === 'true';
}

/** Enable offline mode and initialise the mock database */
export function enableOffline() {
    sessionStorage.setItem(KEYS.OFFLINE, 'true');
    initStore();
}

/** Disable offline mode (used when backend becomes reachable again) */
export function disableOffline() {
    sessionStorage.removeItem(KEYS.OFFLINE);
}

/**
 * Mock an axios-style successful response.
 * @param {*} data  payload
 * @returns {{ data: * }}
 */
function ok(data) { return { data }; }

/**
 * Mock an axios-style error.
 * @param {string} msg
 * @param {number} status
 */
function fail(msg, status = 400) {
    const err = new Error(msg);
    err.response = { data: { error: msg }, status };
    throw err;
}

// ── Route handlers (mirrors backend /api/* routes) ────────────────────────────

/** POST /login */
export function mockLogin({ username, password }) {
    const u = DEMO_USERS[username];
    if (!u || u.password !== password) fail('Invalid username or password', 401);

    const token = `demo_jwt_${username}_${Date.now()}`;
    const user = { user_id: u.user_id, username: u.username, role: u.role, name: u.name, cust_id: u.cust_id || null, emp_id: u.emp_id || null };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Audit
    const audit = ss(KEYS.AUDIT, []);
    audit.unshift({ audit_id: nextId(audit, 'audit_id'), username, action: 'LOGIN', detail: `${username} logged in (demo)`, ip_addr: '127.0.0.1', timestamp: now() });
    ssSave(KEYS.AUDIT, audit);

    return ok({ token, user });
}

/** GET /dashboard */
export function mockDashboard() {
    const accounts     = ss(KEYS.ACCOUNTS, []);
    const customers    = ss(KEYS.CUSTOMERS, []);
    const employees    = ss(KEYS.EMPLOYEES, []);
    const transactions = ss(KEYS.TRANSACTIONS, []);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    let stats, filteredTx;
    if (user.role === 'CUSTOMER') {
        const myAccs = accounts.filter(a => a.cust_id === user.cust_id);
        stats = {
            totalAccounts: myAccs.length,
            totalBalance:  myAccs.reduce((s, a) => s + Number(a.balance), 0),
        };
        const myAccNums = new Set(myAccs.map(a => a.acc_num));
        filteredTx = transactions.filter(t => myAccNums.has(t.acc_num));
    } else {
        stats = {
            totalCustomers: customers.length,
            totalAccounts:  accounts.length,
            totalBalance:   accounts.reduce((s, a) => s + Number(a.balance), 0),
            totalEmployees: employees.length,
        };
        filteredTx = [...transactions];
    }

    filteredTx.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return ok({ stats, recentTransactions: filteredTx.slice(0, 10) });
}

/** GET /accounts  –– returns all accounts (staff) or own accounts (customer) */
export function mockGetAccounts() {
    const accounts = ss(KEYS.ACCOUNTS, []);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'CUSTOMER') {
        return ok(accounts.filter(a => a.cust_id === user.cust_id));
    }
    return ok(accounts);
}

/** GET /accounts/vpa  –– returns all accounts (for UPI/transfer destination) */
export function mockGetVpaAccounts() {
    const accounts = ss(KEYS.ACCOUNTS, []);
    return ok(accounts);
}

/** GET /accounts/:id  –– get single account details */
export function mockGetAccount(accNum) {
    const accounts = ss(KEYS.ACCOUNTS, []);
    const acc = accounts.find(a => String(a.acc_num) === String(accNum));
    if (!acc) fail('Account not found', 404);
    return ok(acc);
}

/** GET /customers */
export function mockGetCustomers() {
    return ok(ss(KEYS.CUSTOMERS, []));
}

/** POST /customers */
export function mockAddCustomer(body) {
    const customers = ss(KEYS.CUSTOMERS, []);
    const newCust = { cust_id: nextId(customers, 'cust_id'), ...body, kyc_status: 'pending' };
    customers.push(newCust);
    ssSave(KEYS.CUSTOMERS, customers);
    _addAudit('ADD_CUSTOMER', `Added customer: ${body.name}`);
    return ok({ message: 'Customer added successfully', cust_id: newCust.cust_id });
}

/** GET /customers/:id */
export function mockGetCustomer(custId) {
    const c = ss(KEYS.CUSTOMERS, []).find(c => String(c.cust_id) === String(custId));
    if (!c) fail('Customer not found', 404);
    return ok(c);
}

/** POST /accounts (create account) */
export function mockCreateAccount(body) {
    const accounts = ss(KEYS.ACCOUNTS, []);
    const customers = ss(KEYS.CUSTOMERS, []);
    const cust = customers.find(c => String(c.cust_id) === String(body.cust_id));
    if (!cust) fail('Customer not found', 404);

    const newAcc = {
        acc_num:       10000 + accounts.length + 1,
        cust_id:       Number(body.cust_id),
        customer_name: cust.name,
        acc_type:      body.acc_type || 'savings',
        balance:       Number(body.initial_deposit) || 0,
        status:        'active',
        vpa:           `${cust.name.split(' ')[0].toLowerCase()}${10000 + accounts.length + 1}@finvault`,
        ifsc:          'FINV0000001',
        branch:        'Main Branch',
    };
    accounts.push(newAcc);
    ssSave(KEYS.ACCOUNTS, accounts);

    // Record initial deposit transaction
    if (newAcc.balance > 0) {
        const txs = ss(KEYS.TRANSACTIONS, []);
        txs.unshift({ id: nextId(txs, 'id'), acc_num: newAcc.acc_num, type: 'deposit', amount: newAcc.balance, is_credit: true, status: 'success', timestamp: now(), description: 'Initial deposit' });
        ssSave(KEYS.TRANSACTIONS, txs);
    }
    _addAudit('CREATE_ACCOUNT', `Opened ${newAcc.acc_type} account #${newAcc.acc_num} for ${cust.name}`);
    return ok({ message: 'Account created', acc_num: newAcc.acc_num });
}

/** POST /transactions/deposit  or  /transactions/withdraw */
export function mockDepositWithdraw({ acc_num, type, amount }) {
    const accounts = ss(KEYS.ACCOUNTS, []);
    const idx = accounts.findIndex(a => String(a.acc_num) === String(acc_num));
    if (idx === -1) fail('Account not found', 404);

    const amt = Number(amount);
    if (amt <= 0) fail('Amount must be positive');

    if (type === 'withdraw' && accounts[idx].balance < amt)
        fail('Insufficient balance');

    if (type === 'deposit') accounts[idx].balance = Number(accounts[idx].balance) + amt;
    else                    accounts[idx].balance = Number(accounts[idx].balance) - amt;
    ssSave(KEYS.ACCOUNTS, accounts);

    const txs = ss(KEYS.TRANSACTIONS, []);
    txs.unshift({ id: nextId(txs, 'id'), acc_num: Number(acc_num), type, amount: amt, is_credit: type === 'deposit', status: 'success', timestamp: now(), description: `${type} via demo` });
    ssSave(KEYS.TRANSACTIONS, txs);
    _addAudit(type.toUpperCase(), `${type} ₹${amt} on ACC#${acc_num}`);
    return ok({ message: `${type} successful`, new_balance: accounts[idx].balance });
}

/** POST /transactions/transfer */
export function mockTransfer({ from_acc, to_acc, amount }) {
    const accounts = ss(KEYS.ACCOUNTS, []);
    const fromIdx = accounts.findIndex(a => String(a.acc_num) === String(from_acc));
    const toIdx   = accounts.findIndex(a => String(a.acc_num) === String(to_acc));

    if (fromIdx === -1 || toIdx === -1) fail('Account not found', 404);
    const amt = Number(amount);
    if (amt <= 0) fail('Amount must be positive');
    if (accounts[fromIdx].balance < amt) fail('Insufficient balance');

    accounts[fromIdx].balance = Number(accounts[fromIdx].balance) - amt;
    accounts[toIdx].balance   = Number(accounts[toIdx].balance) + amt;
    ssSave(KEYS.ACCOUNTS, accounts);

    const txs = ss(KEYS.TRANSACTIONS, []);
    const tId = nextId(txs, 'id');
    txs.unshift({ id: tId,   acc_num: Number(from_acc), type: 'transfer', amount: amt, is_credit: false, status: 'success', timestamp: now(), description: `Transfer to ACC#${to_acc}` });
    txs.unshift({ id: tId+1, acc_num: Number(to_acc),   type: 'transfer', amount: amt, is_credit: true,  status: 'success', timestamp: now(), description: `Transfer from ACC#${from_acc}` });
    ssSave(KEYS.TRANSACTIONS, txs);
    _addAudit('TRANSFER', `Transfer ₹${amt} from ACC#${from_acc} → ACC#${to_acc}`);
    return ok({ message: 'Transfer successful' });
}

/** POST /transactions/upi */
export function mockUpiTransfer({ from_acc, to_vpa, amount }) {
    const accounts = ss(KEYS.ACCOUNTS, []);
    const fromIdx = accounts.findIndex(a => String(a.acc_num) === String(from_acc));
    const toIdx   = accounts.findIndex(a => a.vpa === to_vpa);

    if (fromIdx === -1) fail('Source account not found', 404);
    if (toIdx === -1)   fail('VPA not found – recipient does not exist', 404);
    const amt = Number(amount);
    if (amt <= 0) fail('Amount must be positive');
    if (accounts[fromIdx].balance < amt) fail('Insufficient balance');

    accounts[fromIdx].balance = Number(accounts[fromIdx].balance) - amt;
    accounts[toIdx].balance   = Number(accounts[toIdx].balance)   + amt;
    ssSave(KEYS.ACCOUNTS, accounts);

    const txs = ss(KEYS.TRANSACTIONS, []);
    const tId = nextId(txs, 'id');
    txs.unshift({ id: tId,   acc_num: Number(from_acc),      type: 'upi', amount: amt, is_credit: false, status: 'success', timestamp: now(), description: `UPI to ${to_vpa}` });
    txs.unshift({ id: tId+1, acc_num: accounts[toIdx].acc_num, type: 'upi', amount: amt, is_credit: true,  status: 'success', timestamp: now(), description: `UPI from ${accounts[fromIdx].vpa}` });
    ssSave(KEYS.TRANSACTIONS, txs);
    _addAudit('UPI', `UPI ₹${amt} to ${to_vpa}`);
    return ok({ message: 'UPI transfer successful', to_name: accounts[toIdx].customer_name });
}

/** POST /transactions/atm */
export function mockAtmWithdraw({ acc_num, amount, pin }) {
    // Demo: accept any 4-digit pin
    if (!pin || String(pin).length < 4) fail('Invalid ATM PIN');
    return mockDepositWithdraw({ acc_num, type: 'withdraw', amount });
}

/** POST /transactions/card */
export function mockCardPayment({ acc_num, amount, merchant }) {
    const result = mockDepositWithdraw({ acc_num, type: 'withdraw', amount });
    _addAudit('CARD_PAYMENT', `Card payment ₹${amount} at ${merchant || 'Merchant'}`);
    return result;
}

/** GET /transactions?acc_num=... */
export function mockGetTransactions(accNum) {
    const txs = ss(KEYS.TRANSACTIONS, []);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    let filtered = txs;

    if (accNum) {
        filtered = txs.filter(t => String(t.acc_num) === String(accNum));
    } else if (user.role === 'CUSTOMER') {
        const accounts = ss(KEYS.ACCOUNTS, []);
        const myNums = new Set(accounts.filter(a => a.cust_id === user.cust_id).map(a => a.acc_num));
        filtered = txs.filter(t => myNums.has(t.acc_num));
    }
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return ok(filtered);
}

/** GET /employees */
export function mockGetEmployees() {
    return ok(ss(KEYS.EMPLOYEES, []));
}

/** POST /employees */
export function mockAddEmployee(body) {
    const employees = ss(KEYS.EMPLOYEES, []);
    const newEmp = { emp_id: nextId(employees, 'emp_id'), ...body };
    employees.push(newEmp);
    ssSave(KEYS.EMPLOYEES, employees);
    _addAudit('ADD_EMPLOYEE', `Added employee: ${body.name}`);
    return ok({ message: 'Employee added', emp_id: newEmp.emp_id });
}

/** GET /payroll */
export function mockGetPayroll() {
    const employees = ss(KEYS.EMPLOYEES, []);
    const payroll = employees.map(e => ({
        emp_id:      e.emp_id,
        name:        e.name,
        designation: e.designation,
        department:  e.department,
        salary:      e.salary,
        month:       new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        status:      'paid',
        paid_on:     now().substring(0, 10),
    }));
    return ok(payroll);
}

/** GET /attendance or GET /attendance/:empId */
export function mockGetAttendance(empId) {
    const att = ss(KEYS.ATTENDANCE, []);
    if (empId) return ok(att.filter(a => String(a.emp_id) === String(empId)));
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'EMPLOYEE') return ok(att.filter(a => a.emp_id === user.emp_id));
    return ok(att);
}

/** POST /attendance */
export function mockMarkAttendance(body) {
    const att = ss(KEYS.ATTENDANCE, []);
    // Prevent duplicate for same emp+date
    const exists = att.find(a => String(a.emp_id) === String(body.emp_id) && a.date === body.date);
    if (exists) fail('Attendance already marked for this date');
    att.push({ att_id: nextId(att, 'att_id'), ...body });
    ssSave(KEYS.ATTENDANCE, att);
    _addAudit('MARK_ATTENDANCE', `Attendance marked for EMP#${body.emp_id} on ${body.date}`);
    return ok({ message: 'Attendance marked' });
}

/** GET /audit */
export function mockGetAudit() {
    const audit = ss(KEYS.AUDIT, []);
    return ok([...audit].sort((a, b) => b.audit_id - a.audit_id));
}

// ── Internal helper ───────────────────────────────────────────────────────────
function _addAudit(action, detail) {
    const user  = JSON.parse(localStorage.getItem('user') || '{}');
    const audit = ss(KEYS.AUDIT, []);
    audit.unshift({ audit_id: nextId(audit, 'audit_id'), username: user.username || 'demo', action, detail, ip_addr: '127.0.0.1', timestamp: now() });
    ssSave(KEYS.AUDIT, audit);
}
