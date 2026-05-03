/**
 * api.js
 * ──────────────────────────────────────────────────────────────────────────
 * Axios instance with automatic offline fallback.
 *
 * When the backend is unreachable (network error / CORS / 502 etc.) the
 * interceptor transparently delegates the request to the sessionStore mock
 * so the app remains fully functional as a frontend-only demo.
 *
 * Offline mode is activated automatically on the first connection failure
 * and can also be forced via  enableOffline()  from sessionStore.js.
 * ──────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import {
    isOffline, enableOffline,
    mockLogin, mockDashboard,
    mockGetAccounts, mockGetVpaAccounts, mockGetAccount, mockCreateAccount,
    mockGetCustomers, mockAddCustomer, mockGetCustomer,
    mockDepositWithdraw, mockTransfer, mockUpiTransfer,
    mockAtmWithdraw, mockCardPayment, mockGetTransactions,
    mockGetEmployees, mockAddEmployee,
    mockGetPayroll,
    mockGetAttendance, mockMarkAttendance,
    mockGetAudit,
} from './sessionStore';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 5000,          // treat slow/absent backend as offline quickly
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Response interceptor: fall back to mock on network / server errors ────────
api.interceptors.response.use(
    (response) => response,          // success – pass through unchanged

    async (error) => {
        const req = error.config;

        // Detect "backend unavailable" conditions:
        //   • error.response is undefined  →  network error / timeout / CORS
        //   • status 502 / 503 / 504       →  gateway errors (deployed frontend, local backend down)
        const isNetworkError = !error.response;
        const isGatewayError = [502, 503, 504].includes(error.response?.status);

        if (!isNetworkError && !isGatewayError) {
            // Real HTTP error (4xx/5xx from a live backend) – don't intercept
            return Promise.reject(error);
        }

        // ── Switch to offline mode ────────────────────────────────────────────
        if (!isOffline()) {
            console.warn('[FinVault] Backend unreachable – switching to Demo/Offline mode.');
            enableOffline();
            // Dispatch a custom event so React components can show the banner
            window.dispatchEvent(new CustomEvent('finvault:offline'));
        }

        // ── Route to the appropriate mock handler ─────────────────────────────
        try {
            return routeToMock(req);
        } catch (mockErr) {
            return Promise.reject(mockErr);
        }
    }
);

/**
 * Map an axios request config to the corresponding mock function.
 * Mirrors the backend route table as closely as possible.
 */
function routeToMock(config) {
    const method  = (config.method || 'get').toLowerCase();
    const rawPath = config.url || '';

    // Strip baseURL prefix if present
    const path = rawPath.startsWith('http')
        ? '/' + rawPath.split('/api')[1]
        : rawPath;

    // Extract query params
    const [pathPart, queryStr] = path.split('?');
    const qs = new URLSearchParams(queryStr || '');
    const body = parseBody(config.data);

    // ── /login ────────────────────────────────────────────────────────────────
    if (method === 'post' && pathPart === '/login')
        return mockLogin(body);

    // ── /dashboard ────────────────────────────────────────────────────────────
    if (method === 'get' && pathPart === '/dashboard')
        return mockDashboard();

    // ── /accounts ─────────────────────────────────────────────────────────────
    if (method === 'get' && pathPart === '/accounts/vpa')
        return mockGetVpaAccounts();

    if (method === 'get' && pathPart.startsWith('/accounts/')) {
        const id = pathPart.split('/accounts/')[1];
        return mockGetAccount(id);
    }

    if (method === 'get' && pathPart === '/accounts')
        return mockGetAccounts();

    if (method === 'post' && pathPart === '/accounts')
        return mockCreateAccount(body);

    // ── /customers ────────────────────────────────────────────────────────────
    if (method === 'get' && pathPart === '/customers')
        return mockGetCustomers();

    if (method === 'post' && pathPart === '/customers')
        return mockAddCustomer(body);

    if (method === 'get' && pathPart.startsWith('/customers/')) {
        const id = pathPart.split('/customers/')[1];
        return mockGetCustomer(id);
    }

    // ── /transactions ─────────────────────────────────────────────────────────
    if (method === 'post' && pathPart === '/transactions/deposit')
        return mockDepositWithdraw({ ...body, type: 'deposit' });

    if (method === 'post' && pathPart === '/transactions/withdraw')
        return mockDepositWithdraw({ ...body, type: 'withdraw' });

    if (method === 'post' && pathPart === '/transactions/transfer')
        return mockTransfer(body);

    if (method === 'post' && pathPart === '/transactions/upi')
        return mockUpiTransfer(body);

    if (method === 'post' && pathPart === '/transactions/atm')
        return mockAtmWithdraw(body);

    if (method === 'post' && pathPart === '/transactions/card')
        return mockCardPayment(body);

    if (method === 'get' && (pathPart === '/transactions' || pathPart.startsWith('/transactions')))
        return mockGetTransactions(qs.get('acc_num'));

    // ── /employees ────────────────────────────────────────────────────────────
    if (method === 'get' && pathPart === '/employees')
        return mockGetEmployees();

    if (method === 'post' && pathPart === '/employees')
        return mockAddEmployee(body);

    // ── /payroll ──────────────────────────────────────────────────────────────
    if (method === 'get' && pathPart === '/payroll')
        return mockGetPayroll();

    // ── /attendance ───────────────────────────────────────────────────────────
    if (method === 'post' && pathPart === '/attendance')
        return mockMarkAttendance(body);

    if (method === 'get' && pathPart.startsWith('/attendance/')) {
        const empId = pathPart.split('/attendance/')[1];
        return mockGetAttendance(empId);
    }

    if (method === 'get' && pathPart === '/attendance')
        return mockGetAttendance(null);

    // ── /audit ────────────────────────────────────────────────────────────────
    if (method === 'get' && pathPart === '/audit')
        return mockGetAudit();

    // ── Fallback: unknown route in offline mode ───────────────────────────────
    console.warn('[FinVault Demo] No mock for:', method.toUpperCase(), pathPart);
    const err = new Error('Endpoint not available in demo mode');
    err.response = { data: { error: 'Not available in demo mode' }, status: 501 };
    throw err;
}

/** Safely parse axios request body (may already be an object or a JSON string) */
function parseBody(data) {
    if (!data) return {};
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return {}; }
}

export default api;
